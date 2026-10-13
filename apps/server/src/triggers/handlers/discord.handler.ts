import { createHash, createPublicKey, verify } from "node:crypto";
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
	type: z.literal(2),
	context: z.literal(1), // BOT_DM, not server channels or other private channels.
	guild_id: z.never().optional(),
	channel_id: snowflake.optional(),
	channel: z.object({ id: snowflake }).optional(),
	user: z.object({ id: snowflake, username: z.string() }),
	data: z.object({
		id: snowflake,
		type: z.literal(1), // CHAT_INPUT (slash command).
		name: z.string().min(1).max(32),
		options: z.array(z.json()).default([]),
		resolved: z.record(z.string(), z.json()).optional(),
	}),
});

const messageResponse = (content: string): TriggerResponse => ({
	status: 200,
	body: { type: 4, data: { content, allowed_mentions: { parse: [] } } },
});

const getApplication = async (botToken: string) => {
	// Cache public metadata under a token hash; never store the bot token here.
	const key = `discord:application:${createHash("sha256").update(botToken).digest("hex")}`;
	const cached = await redis.get(key);
	if (cached) {
		try {
			const result = applicationSchema.safeParse(JSON.parse(cached));
			if (result.success) return result.data;
		} catch {
			// An invalid cache value is replaced by a fresh API response.
		}
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
			response: messageResponse("Workflow started."),
		};
	},
};
