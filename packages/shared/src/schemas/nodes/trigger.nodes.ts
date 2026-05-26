import { z } from "zod";
import {
	anyNodeValueSchema,
	baseNodeSchema,
	nodeParameterSchema,
} from "./base.nodes.js";
import { withExpr } from "./validation.js";

export const baseTriggerNodeSchema = baseNodeSchema.extend({
	inputPorts: z
		.array(z.object({ name: z.string(), label: z.string() }))
		.length(0),
});

export const clickNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.click"),
	type: z.literal("trigger"),
});

export const cronJobNodeValueSchemas = {
	trigger_type: withExpr(z.enum(["interval", "cron"])),
	interval_value: withExpr(z.coerce.number().min(1)),
	interval_unit: withExpr(z.enum(["seconds", "minutes", "hours", "days"])),
	cron_expression: withExpr(z.string().max(100)),
	limit: withExpr(z.coerce.number().min(1).optional()).optional(),
} as const;

export const cronJobNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.cron"),
	type: z.union([z.literal("trigger"), z.literal("action")]),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("trigger_type"),
				label: z.literal("Trigger Type"),
				type: z.literal("dropdown"),
				value: cronJobNodeValueSchemas.trigger_type,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("interval_value"),
				label: z.literal("Every"),
				type: z.literal("number"),
				value: cronJobNodeValueSchemas.interval_value,
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
				value: cronJobNodeValueSchemas.interval_unit,
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
				value: cronJobNodeValueSchemas.cron_expression,
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
				value: cronJobNodeValueSchemas.limit,
			}),
		]),
	),
});

export const inputNodeValueSchemas = {
	inputs: withExpr(z.record(z.string(), anyNodeValueSchema)),
} as const;

export const inputNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.input"),
	type: z.literal("trigger"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Input Data"),
				name: z.literal("inputs"),
				type: z.literal("key-value"),
				value: inputNodeValueSchemas.inputs,
				required: z.boolean(),
			}),
		]),
	),
});

export const webhookNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.webhook"),
	type: z.literal("trigger"),
	parameters: z.tuple([]),
});
