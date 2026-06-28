import { z } from "zod";
import {
	baseNodeSchema,
	nodeOutputPortsSchema,
	nodeParameterSchema,
} from "./base.nodes.js";
import { withExpr } from "./validation.js";

export const comparisonOperatorsEnum = z.enum([
	"eq",
	"neq",
	"gt",
	"lt",
	"gte",
	"lte",
	"con",
	"emt",
]);

export const conditionalNodeValueSchemas = {
	left_operand: withExpr(z.union([z.string(), z.number(), z.boolean()])),
	right_operand: withExpr(z.union([z.string(), z.number(), z.boolean()])),
	operator: withExpr(comparisonOperatorsEnum),
} as const;

export const loopNodeValueSchemas = {
	field: withExpr(z.string()),
} as const;

export const loopNodeSchema = baseNodeSchema.extend({
	type: z.literal("action"),
	task: z.literal("action.loop"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Field"),
				name: z.literal("field"),
				type: z.literal("input"),
				value: loopNodeValueSchemas.field,
				required: z.boolean(),
			}),
		]),
	),
	outputPorts: z.array(nodeOutputPortsSchema).default([
		{ name: "loop", label: "Loop" },
		{ name: "done", label: "Done" },
	]),
});

export const conditionalNodeSchema = baseNodeSchema.extend({
	type: z.literal("action"),
	task: z.literal("action.condition"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("left_operand"),
				type: z.literal("input"),
				value: conditionalNodeValueSchemas.left_operand,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("right_operand"),
				type: z.literal("input"),
				value: conditionalNodeValueSchemas.right_operand,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("operator"),
				type: z.literal("dropdown"),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.optional(),
				value: conditionalNodeValueSchemas.operator,
				required: z.boolean(),
			}),
		]),
	),
	outputPorts: z.array(nodeOutputPortsSchema).default([
		{ name: "true", label: "True" },
		{ name: "false", label: "False" },
	]),
});
