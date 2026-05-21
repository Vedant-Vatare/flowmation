import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

export const discordNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.discord"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("webhookUrl"),
				label: z.literal("webhook URL"),
				type: z.literal("input"),
				value: z.string(),
				placeholder: z.literal("https://discord.com/api/webhooks/..."),
				required: z.boolean().default(true),
			}),
			nodeParameterSchema.extend({
				name: z.literal("message"),
				label: z.literal("message"),
				type: z.literal("textarea"),
				value: z.string(),
				required: z.boolean().default(true),
			}),
			nodeParameterSchema.extend({
				name: z.literal("botName"),
				label: z.literal("bot name"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean().default(false),
			}),
		]),
	),
});
