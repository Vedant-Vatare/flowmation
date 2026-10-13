import { createHash, createPublicKey, verify } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { redis } from "@nodebase/redis";
import { discordTriggerNodeSchema } from "@nodebase/shared";
import createHttpError from "http-errors";
import { z } from "zod";
import type { TriggerHandler, TriggerResponse } from "../registry.js";

const snowflake = z.string().regex(/^\d+$/);
const applicationSchema = z.object({
	id: snowflake,
	verify_key: z.string().regex(/^[a-f\d]{64}$/i),
});
const interactionSchema = z.object({
	type: z.number().int(),
	application_id: snowflake.optional(),
});
const commandSchema = z.object({
	id: snowflake,
	application_id: snowflake,
	token: z.string().min(1),
	type: z.literal(2),
	context: z.literal(1),
	guild_id: z.never().optional(),
	channel_id: snowflake.optional(),
	channel: z.object({ id: snowflake }).optional(),
	user: z.object({ id: snowflake, username: z.string() }),
	data: z.object({
		id: snowflake,
		type: z.literal(1),
		name: z.string().min(1).max(32),
		options: z.array(z.json()).default([]),
		resolved: z.record(z.string(), z.json()).optional(),
	}),
});

const messageResponse = (content: string): TriggerResponse => ({
	status: 200,
	body: { type: 4, data: { content, allowed_mentions: { parse: [] } } },
});

const removeAcknowledgement = async (
	applicationId: string,
	interactionToken: string,
	interactionId: string,
) => {
	const url = `https://discord.com/api/v10/webhooks/${applicationId}/${encodeURIComponent(interactionToken)}/messages/@original`;
	let retryDelay = 150;
	for (let attempt = 0; attempt < 5; attempt++) {
		// Local response completion can precede Discord creating the original reply.
		await delay(retryDelay);
		try {
			const response = await fetch(url, {
				method: "DELETE",
				signal: AbortSignal.timeout(2000),
			});
			if (response.ok) return;
			if (response.status === 429) {
				const body = z
					.object({ retry_after: z.number().min(0).max(5) })
					.safeParse(await response.json().catch(() => null));
				if (!body.success) break;
				const seconds = body.data.retry_after;
				retryDelay = Math.max(150, Math.ceil(seconds * 1000));
				continue;
			}
			if (response.status !== 404 && response.status < 500) break;
		} catch {}
		retryDelay = Math.min(150 * 2 ** (attempt + 1), 2000);
	}
	console.warn("Discord acknowledgement cleanup could not be confirmed", {
		interactionId,
	});
};

const getApplication = async (botToken: string) => {
	const key = `discord:application:${createHash("sha256").update(botToken).digest("hex")}`;
	const cached = await redis.get(key);
	if (cached) {
		try {
			const result = applicationSchema.safeParse(JSON.parse(cached));
			if (result.success) return result.data;
		} catch {}
	}

	let response: Response;
	try {
		response = await fetch("https://discord.com/api/v10/applications/@me", {
			headers: { Authorization: `Bot ${botToken}` },
			signal: AbortSignal.timeout(1500),
		});
	} catch {
		throw createHttpError.ServiceUnavailable(
			"Discord application lookup failed; retry the request",
		);
	}
	if (response.status === 401 || response.status === 403) {
		throw createHttpError.BadRequest("Discord bot token is invalid or revoked");
	}
	if (!response.ok) {
		throw createHttpError.ServiceUnavailable(
			"Discord application lookup failed; retry the request",
		);
	}
	let body: unknown;
	try {
		body = await response.json();
	} catch {
		throw createHttpError.BadGateway(
			"Discord returned an invalid application response",
		);
	}
	const application = applicationSchema.safeParse(body);
	if (!application.success) {
		throw createHttpError.BadGateway(
			"Discord application identity or public key is missing",
		);
	}
	await redis.set(key, JSON.stringify(application.data), "EX", 3600);
	return application.data;
};

export const discordTriggerHandler: TriggerHandler = {
	verifyRequest: async (request, context) => {
		if (request.method !== "POST") {
			return {
				valid: false,
				response: { status: 405, headers: { Allow: "POST" } },
			};
		}
		const signature = request.headers["x-signature-ed25519"];
		const timestamp = request.headers["x-signature-timestamp"];
		if (
			typeof signature !== "string" ||
			!/^[a-f\d]{128}$/i.test(signature) ||
			typeof timestamp !== "string" ||
			!/^\d+$/.test(timestamp) ||
			Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
		) {
			return {
				valid: false,
				response: {
					status: 401,
					body: { message: "Invalid Discord signature or timestamp" },
				},
			};
		}
		const botToken = context.credential?.botToken;
		if (!botToken)
			throw createHttpError.BadRequest("Discord bot token is missing");
		const application = await getApplication(botToken);
		// SPKI prefix wraps Discord's raw 32-byte Ed25519 key for node:crypto.
		const publicKey = createPublicKey({
			key: Buffer.concat([
				Buffer.from("302a300506032b6570032100", "hex"),
				Buffer.from(application.verify_key, "hex"),
			]),
			format: "der",
			type: "spki",
		});
		const valid = verify(
			null,
			Buffer.concat([Buffer.from(timestamp), Buffer.from(request.rawBody)]),
			publicKey,
			Buffer.from(signature, "hex"),
		);
		if (!valid)
			return {
				valid: false,
				response: {
					status: 401,
					body: { message: "Invalid Discord signature" },
				},
			};
		const interaction = interactionSchema.safeParse(request.body);
		if (!interaction.success) {
			return {
				valid: false,
				response: {
					status: 400,
					body: { message: "Invalid Discord interaction" },
				},
			};
		}
		if (
			(interaction.data.type !== 1 ||
				interaction.data.application_id !== undefined) &&
			interaction.data.application_id !== application.id
		) {
			return {
				valid: false,
				response: {
					status: 401,
					body: {
						message: "Discord application does not match the credential",
					},
				},
			};
		}
		return { valid: true };
	},
	handleSetup: async (request) => {
		const interaction = interactionSchema.parse(request.body);
		return interaction.type === 1 ? { status: 200, body: { type: 1 } } : null;
	},
	handleEvent: async (request, context) => {
		const interaction = interactionSchema.parse(request.body);
		if (interaction.type !== 2) {
			return {
				kind: "ignore",
				response: {
					status: 400,
					body: { message: "Only slash commands are supported" },
				},
			};
		}
		const command = commandSchema.safeParse(request.body);
		if (!command.success) {
			return {
				kind: "ignore",
				response: messageResponse(
					"This workflow accepts slash commands in DMs with the bot only.",
				),
			};
		}
		const node = discordTriggerNodeSchema.parse(context.node);
		const commandName =
			node.parameters.find((param) => param.name === "commandName")?.value ??
			"";
		const allowedUserIds =
			node.parameters.find((param) => param.name === "allowedUserIds")?.value ??
			[];
		if (commandName && commandName !== command.data.data.name) {
			return {
				kind: "ignore",
				response: messageResponse(
					"This command is not enabled for this workflow.",
				),
			};
		}
		if (
			allowedUserIds.length &&
			!allowedUserIds.includes(command.data.user.id)
		) {
			return {
				kind: "ignore",
				response: messageResponse("You are not allowed to run this workflow."),
			};
		}
		const channelId = command.data.channel_id ?? command.data.channel?.id;
		if (!channelId)
			throw createHttpError.BadRequest(
				"Discord interaction channel is missing",
			);
		const acknowledgementMessage =
			node.parameters.find((param) => param.name === "acknowledgementMessage")
				?.value ?? "";
		const shouldRemove =
			!acknowledgementMessage ||
			(node.parameters.find((param) => param.name === "removeAcknowledgement")
				?.value ??
				true);
		const response = messageResponse(
			acknowledgementMessage || "Command received.",
		);
		return {
			kind: "trigger",
			eventId: command.data.id,
			data: {
				interactionId: command.data.id,
				applicationId: command.data.application_id,
				commandId: command.data.data.id,
				commandName: command.data.data.name,
				options: command.data.data.options,
				resolved: command.data.data.resolved ?? {},
				userId: command.data.user.id,
				username: command.data.user.username,
				channelId,
			},
			response: {
				...response,
				afterResponse: shouldRemove
					? () =>
							removeAcknowledgement(
								command.data.application_id,
								command.data.token,
								command.data.id,
							)
					: undefined,
			},
		};
	},
};
