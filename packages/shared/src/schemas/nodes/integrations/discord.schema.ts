import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const discordNodeValueSchemas = {
	operation: withExpr(z.enum(["send_webhook", "send_dm"])),
	userId: withExpr(z.string().regex(/^\d+$/, "Must be a Discord user ID")),
	webhookUrl: withExpr(
		z.url({ error: "Must be a valid webhook URL" }).max(4000),
	),
	message: withExpr(z.string().max(10000)),
	botName: withExpr(z.string().max(2000)),
} as const;

export const discordNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.discord"),
	type: z.literal("action"),
	credentialProvider: z.literal("discord").optional(),
	credentialId: z.uuid().nullable().optional(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("operation"),
				label: z.literal("Operation"),
				type: z.literal("dropdown"),
				value: discordNodeValueSchemas.operation,
				default: z.literal("send_webhook").optional(),
				required: z.boolean().default(true),
			}),
			nodeParameterSchema.extend({
				name: z.literal("userId"),
				label: z.literal("User ID"),
				type: z.literal("input"),
				value: discordNodeValueSchemas.userId,
				required: z.boolean().default(true),
			}),
			nodeParameterSchema.extend({
				name: z.literal("webhookUrl"),
				label: z.literal("webhook URL"),
				type: z.literal("input"),
				value: discordNodeValueSchemas.webhookUrl,
				placeholder: z.string().optional(),
				required: z.boolean().default(true),
			}),
			nodeParameterSchema.extend({
				name: z.literal("message"),
				label: z.literal("message"),
				type: z.literal("textarea"),
				value: discordNodeValueSchemas.message,
				required: z.boolean().default(true),
			}),
			nodeParameterSchema.extend({
				name: z.literal("botName"),
				label: z.literal("bot name"),
				type: z.literal("input"),
				value: discordNodeValueSchemas.botName,
				required: z.boolean().default(false),
			}),
		]),
	),
});
