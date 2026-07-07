import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const numberTransformNodeValueSchemas = {
	operand_a: withExpr(z.union([z.string(), z.number()])),
	operand_b: withExpr(z.union([z.string(), z.number()])),
	operation: withExpr(
		z.enum(["add", "subtract", "multiply", "divide", "modulo", "round", "floor", "ceil", "min", "max"]),
	),
	precision: withExpr(z.coerce.number().min(0).max(10)),
} as const;

export const numberTransformNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.number_transform"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operand A"),
				name: z.literal("operand_a"),
				type: z.literal("input"),
				value: numberTransformNodeValueSchemas.operand_a,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: numberTransformNodeValueSchemas.operation,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Operand B"),
				name: z.literal("operand_b"),
				type: z.literal("input"),
				value: numberTransformNodeValueSchemas.operand_b,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["add", "subtract", "multiply", "divide", "modulo", "min", "max"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Precision"),
				name: z.literal("precision"),
				type: z.literal("number"),
				value: numberTransformNodeValueSchemas.precision,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("round")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
