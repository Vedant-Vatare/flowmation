import { z } from "zod";
import {
	baseNodeSchema,
	nodeInputPortsSchema,
	nodeOutputPortsSchema,
	nodeParameterSchema,
} from "./base.nodes.js";

export const httpNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.http"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("URL"),
				name: z.literal("url"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Method"),
				name: z.literal("method"),
				type: z.literal("dropdown"),
				value: z.string(),
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("URL Parameters"),
				name: z.literal("urlParams"),
				type: z.literal("key-value"),
				value: z.array(z.record(z.string(), z.string())),
				required: z.boolean(),
				multiValued: z.boolean().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Body"),
				name: z.literal("body"),
				type: z.literal("textarea"),
				value: z.string(),
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
				value: z.array(z.record(z.string(), z.string())),
				required: z.boolean(),
				multiValued: z.boolean().optional(),
			}),
		]),
	),
});

export const mergeDataSchema = baseNodeSchema.extend({
	type: z.literal("action"),
	task: z.literal("action.merge"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("input1"),
				type: z.literal("input"),
				label: z.literal("Input 1"),
				value: z.unknown(),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("input2"),
				type: z.literal("input"),
				label: z.literal("Input 2"),
				value: z.unknown(),
				required: z.boolean(),
			}),
		]),
	),
	inputPorts: z.array(nodeInputPortsSchema).default([
		{
			name: "input1",
			label: "Input 1",
		},
		{
			name: "input2",
			label: "Input 2",
		},
	]),
	outputPorts: z.array(nodeOutputPortsSchema).default([
		{
			name: "default",
			label: "Default",
		},
	]),
});

const startOptionSchema = z.object({
	label: z.string(),
	value: z.enum(["time_period", "date_time"]),
});

const timeUnitOptionSchema = z.object({
	label: z.string(),
	value: z.enum(["seconds", "minutes", "hours", "days"]),
});

export const waitingNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.wait"),
	type: z.union([z.literal("trigger"), z.literal("action")]),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Start on"),
				name: z.literal("start"),
				type: z.literal("dropdown"),
				value: z.enum(["time_period", "date_time"]),
				options: z.array(startOptionSchema),
				default: z.literal("time_period").optional(),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Wait time"),
				name: z.literal("wait_time_period"),
				type: z.literal("number"),
				value: z.union([z.number(), z.string()]),
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
				value: z.enum(["seconds", "minutes", "hours", "days"]),
				options: z.array(timeUnitOptionSchema),
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
				value: z.string(),
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
