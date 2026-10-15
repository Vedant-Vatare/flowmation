import { createHmac, timingSafeEqual } from "node:crypto";
import { githubTriggerNodeSchema } from "@nodebase/shared";
import createHttpError from "http-errors";
import { z } from "zod";
import type { TriggerHandler } from "../registry.js";

const payloadSchema = z.looseObject({
	repository: z.looseObject({ full_name: z.string().min(1) }),
	action: z.string().optional(),
	ref: z.string().optional(),
});

export const githubTriggerHandler: TriggerHandler = {
	verifyRequest: async (request, context) => {
		if (request.method !== "POST") {
			return {
				valid: false,
				response: { status: 405, headers: { Allow: "POST" } },
			};
		}
		const secret = context.credential?.webhookSecret;
		if (!secret)
			throw createHttpError.BadRequest("GitHub webhook secret is missing");
		const signature = request.headers["x-hub-signature-256"];
		if (
			typeof signature !== "string" ||
			!/^sha256=[a-f\d]{64}$/i.test(signature) ||
			!timingSafeEqual(
				createHmac("sha256", secret).update(request.rawBody).digest(),
				Buffer.from(signature.slice(7), "hex"),
			)
		) {
			return {
				valid: false,
				response: {
					status: 401,
					body: { message: "Invalid GitHub signature" },
				},
			};
		}
		const event = request.headers["x-github-event"];
		const deliveryId = request.headers["x-github-delivery"];
		if (
			typeof event !== "string" ||
			!/^[a-z_]+$/.test(event) ||
			typeof deliveryId !== "string" ||
			!z.uuid().safeParse(deliveryId).success
		) {
			return {
				valid: false,
				response: {
					status: 400,
					body: { message: "Invalid GitHub event or delivery headers" },
				},
			};
		}
		const payload = payloadSchema.safeParse(request.body);
		if (!payload.success) {
			return {
				valid: false,
				response: {
					status: 400,
					body: {
						message: "Invalid GitHub repository payload; use application/json",
					},
				},
			};
		}
		const node = githubTriggerNodeSchema.parse(context.node);
		const repository = node.parameters.find(
			(param) => param.name === "repository",
		)?.value;
		if (!repository)
			throw createHttpError.BadRequest("GitHub repository is missing");
		if (
			repository.toLowerCase() !==
			payload.data.repository.full_name.toLowerCase()
		) {
			return {
				valid: false,
				response: {
					status: 403,
					body: { message: "GitHub repository does not match this trigger" },
				},
			};
		}
		return { valid: true };
	},
	handleSetup: async (request) =>
		request.headers["x-github-event"] === "ping"
			? { status: 200, body: { message: "GitHub webhook connected" } }
			: null,
	handleEvent: async (request, context) => {
		const node = githubTriggerNodeSchema.parse(context.node);
		const payload = payloadSchema.parse(request.body);
		const event = request.headers["x-github-event"] as string;
		const selectedEvent =
			node.parameters.find((param) => param.name === "event")?.value ?? "push";
		const actions =
			node.parameters.find((param) => param.name === "actions")?.value ?? [];
		const branch =
			node.parameters.find((param) => param.name === "branch")?.value ?? "";
		if (
			(selectedEvent !== "*" && selectedEvent !== event) ||
			(actions.length > 0 &&
				(!payload.action || !actions.includes(payload.action))) ||
			(event === "push" && branch && payload.ref !== `refs/heads/${branch}`)
		) {
			return {
				kind: "ignore",
				response: { status: 200, body: { message: "Event filtered" } },
			};
		}
		const deliveryId = request.headers["x-github-delivery"] as string;
		return {
			kind: "trigger",
			eventId: deliveryId,
			data: {
				event,
				deliveryId,
				action: payload.action ?? null,
				repository: payload.repository,
				sender: payload.sender ?? null,
				payload,
			},
			response: { status: 202, body: { message: "Event accepted" } },
		};
	},
};
