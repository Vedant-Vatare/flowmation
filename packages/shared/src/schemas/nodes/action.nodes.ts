import { z } from "zod";
import {
	baseNodeSchema,
	nodeInputPortsSchema,
	nodeOutputPortsSchema,
	nodeParameterSchema,
} from "./base.nodes.js";
import { withExpr } from "./validation.js";

export const httpNodeValueSchemas = {
	url: withExpr(z.url({ error: "Must be a valid URL" }).max(4000)),
	method: withExpr(z.string()),
	urlParams: withExpr(z.record(z.string(), z.string())),
	body: withExpr(z.string().max(10000)),
	headers: withExpr(
		z.record(z.string(), z.union([z.string(), z.array(z.string())])),
	),
} as const;

export const httpNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.http"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("URL"),
				name: z.literal("url"),
				type: z.literal("input"),
				value: httpNodeValueSchemas.url,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Method"),
				name: z.literal("method"),
				type: z.literal("dropdown"),
				value: httpNodeValueSchemas.method,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("URL Parameters"),
				name: z.literal("urlParams"),
				type: z.literal("key-value"),
				value: httpNodeValueSchemas.urlParams,
				required: z.boolean(),
				multiValued: z.boolean().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Body"),
				name: z.literal("body"),
				type: z.literal("textarea"),
				value: httpNodeValueSchemas.body,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("method"),
							values: z.array(z.enum(["POST", "PUT", "PATCH", "DELETE"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Headers"),
				name: z.literal("headers"),
				type: z.literal("key-value"),
				value: httpNodeValueSchemas.headers,
				required: z.boolean(),
				multiValued: z.boolean().optional(),
			}),
		]),
	),
});

export const mergeDataNodeValueSchemas = {
	mode: withExpr(z.enum(["append", "combine"])),
} as const;

export const mergeDataNodeSchema = baseNodeSchema.extend({
	type: z.literal("action"),
	task: z.literal("action.merge"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("mode"),
				type: z.literal("dropdown"),
				label: z.literal("merge mode"),
				value: mergeDataNodeValueSchemas.mode,
				default: z.enum(["append", "combine"]).optional(),
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
		]),
	),
	inputPorts: z.array(nodeInputPortsSchema).default([
		{
			name: "default",
			label: "Default",
		},
	]),
	outputPorts: z.array(nodeOutputPortsSchema).default([
		{
			name: "default",
			label: "Default",
		},
	]),
});

export const waitingNodeValueSchemas = {
	start: withExpr(z.enum(["time_period", "date_time"])),
	wait_time_period: withExpr(z.coerce.number().min(1)),
	time_unit: withExpr(z.enum(["seconds", "minutes", "hours", "days"])),
	date_time: withExpr(z.string()),
} as const;

export const waitingNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.wait"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Start on"),
				name: z.literal("start"),
				type: z.literal("dropdown"),
				value: waitingNodeValueSchemas.start,
				options: z.array(
					z.object({
						label: z.string(),
						value: z.enum(["time_period", "date_time"]),
					}),
				),
				default: z.literal("time_period").optional(),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Wait time"),
				name: z.literal("wait_time_period"),
				type: z.literal("number"),
				value: waitingNodeValueSchemas.wait_time_period,
				default: z.literal("10").optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("start"),
							values: z.array(z.literal("time_period")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("time unit"),
				name: z.literal("time_unit"),
				type: z.literal("dropdown"),
				value: waitingNodeValueSchemas.time_unit,
				options: z.array(
					z.object({
						label: z.string(),
						value: z.enum(["seconds", "minutes", "hours", "days"]),
					}),
				),
				default: z.literal("seconds").optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("start"),
							values: z.array(z.literal("time_period")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("At specific time"),
				name: z.literal("date_time"),
				type: z.literal("date-time"),
				value: waitingNodeValueSchemas.date_time,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("start"),
							values: z.array(z.literal("date_time")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
