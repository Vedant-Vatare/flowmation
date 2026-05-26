import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const discordNodeValueSchemas = {
	webhookUrl: withExpr(
		z.url({ error: "Must be a valid webhook URL" }).max(4000),
	),
	message: withExpr(z.string().max(10000)),
	botName: withExpr(z.string().max(2000)),
} as const;

export const discordNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.discord"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
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
