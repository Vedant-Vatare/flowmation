import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "./base.nodes.js";

export const gmailTriggerNodeValueSchemas = {
	labelId: z
		.string()
		.trim()
		.min(1)
		.max(255)
		.refine(
			(value) => !value.includes("{{") && !value.includes("}}"),
			"Label filters cannot contain expressions",
		),
} as const;

export const gmailTriggerNodeSchema = baseNodeSchema.extend({
	task: z.literal("trigger.gmail"),
	type: z.literal("trigger"),
	credentialProvider: z.literal("google").default("google"),
	inputPorts: z.tuple([]).default([]),
	parameters: z.tuple([
		nodeParameterSchema.extend({
			name: z.literal("labelId"),
			label: z.literal("Label ID"),
			type: z.literal("input"),
			value: gmailTriggerNodeValueSchemas.labelId,
			default: z.literal("INBOX").optional(),
			required: z.literal(true),
		}),
	]),
});
