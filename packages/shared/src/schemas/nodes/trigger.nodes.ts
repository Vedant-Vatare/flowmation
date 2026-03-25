import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "./base.nodes.js";

export const baseTriggerNodeSchema = baseNodeSchema.extend({
	inputPorts: z
		.array(z.object({ name: z.string(), label: z.string() }))
		.length(0),
});

export const clickNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.click"),
	type: z.literal("trigger"),
});

export const cronJobNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.cron"),
	type: z.union([z.literal("trigger"), z.literal("action")]),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Minutes"),
				name: z.literal("minutes"),
				type: z.literal("number"),
				value: z.number(),
				default: z.literal("0").optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Hour"),
				name: z.literal("hour"),
				type: z.literal("number"),
				value: z.number(),
				default: z.literal("0").optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Day of the Month"),
				name: z.literal("day_of_the_month"),
				type: z.literal("number"),
				value: z.number(),
				default: z.literal("0").optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Month"),
				name: z.literal("month"),
				type: z.literal("number"),
				value: z.number(),
				default: z.literal("0").optional(),
			}),
		]),
	),
});

export const inputNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.input"),
	type: z.literal("trigger"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Input Data"),
				name: z.literal("inputs"),
				type: z.literal("key-value"),
				value: z.union([
					z.record(z.string(), z.unknown()),
					z.array(z.unknown()),
				]),
				required: z.boolean(),
			}),
		]),
	),
});
