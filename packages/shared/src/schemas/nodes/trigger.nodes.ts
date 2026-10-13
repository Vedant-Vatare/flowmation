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

export const discordTriggerNodeValueSchemas = {
	commandName: z
		.string()
		.trim()
		.max(32)
		.refine((value) => !value.includes("{{") && !value.includes("}}"), {
			error: "Command filters cannot contain expressions",
		})
		.default(""),
	allowedUserIds: z
		.array(z.string().regex(/^\d+$/, "Must be a Discord user ID"))
		.default([]),
	acknowledgementMessage: z
		.string()
		.trim()
		.max(2000)
		.refine((value) => !value.includes("{{") && !value.includes("}}"), {
			error: "Acknowledgements cannot contain expressions",
		})
		.default(""),
	removeAcknowledgement: z.boolean().default(true),
} as const;

export const discordTriggerNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.discord"),
	type: z.literal("trigger"),
	credentialProvider: z.literal("discord").default("discord"),
	inputPorts: z.tuple([]).default([]),
	outputPorts: z
		.tuple([
			z.object({ name: z.literal("default"), label: z.literal("Default") }),
		])
		.default([{ name: "default", label: "Default" }]),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("commandName"),
				label: z.literal("Command name"),
				type: z.literal("input"),
				value: discordTriggerNodeValueSchemas.commandName,
				required: z.literal(false).default(false),
			}),
			nodeParameterSchema.extend({
				name: z.literal("allowedUserIds"),
				label: z.literal("Allowed user IDs"),
				type: z.literal("array"),
				value: discordTriggerNodeValueSchemas.allowedUserIds,
				required: z.literal(false).default(false),
			}),
			nodeParameterSchema.extend({
				name: z.literal("acknowledgementMessage"),
				label: z.literal("Acknowledgement message"),
				type: z.literal("input"),
				value: discordTriggerNodeValueSchemas.acknowledgementMessage,
				required: z.literal(false).default(false),
			}),
			nodeParameterSchema.extend({
				name: z.literal("removeAcknowledgement"),
				label: z.literal("Remove acknowledgement"),
				type: z.literal("boolean"),
				value: discordTriggerNodeValueSchemas.removeAcknowledgement,
				required: z.literal(false).default(false),
			}),
		]),
	),
});
