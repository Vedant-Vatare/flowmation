import { z } from "zod";
import {
	anyNodeValueSchema,
	baseNodeSchema,
	nodeParameterSchema,
} from "./base.nodes.js";

export const baseTriggerNodeSchema = baseNodeSchema.extend({
	inputPorts: z
		.array(z.object({ name: z.string(), label: z.string() }))
		.length(0),
});

export const clickNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.click"),
	type: z.literal("trigger"),
});

export const cronJobNodeSchema = baseNodeSchema.extend({
	task: z.literal("trigger.cron"),
	type: z.union([z.literal("trigger"), z.literal("action")]),
	inputPorts: z
		.array(z.object({ name: z.string(), label: z.string() }))
		.length(0),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("trigger_type"),
				label: z.literal("Trigger Type"),
				type: z.literal("dropdown"),
				value: z.enum(["interval", "cron"]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("interval_value"),
				label: z.literal("Every"),
				type: z.literal("number"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("trigger_type"),
							values: z.array(z.literal("interval")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("interval_unit"),
				label: z.literal("Unit"),
				type: z.literal("dropdown"),
				value: z.enum(["seconds", "minutes", "hours", "days"]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("trigger_type"),
							values: z.array(z.literal("interval")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("cron_expression"),
				label: z.literal("Cron Expression"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("trigger_type"),
							values: z.array(z.literal("cron")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("limit"),
				label: z.literal("Limit"),
				type: z.literal("input"),
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
				value: z.record(z.string(), anyNodeValueSchema),
				required: z.boolean(),
			}),
		]),
	),
});
