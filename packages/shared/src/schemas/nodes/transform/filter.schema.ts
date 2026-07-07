import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const filterNodeValueSchemas = {
	input_data: withExpr(z.union([z.string(), z.array(z.any()), z.record(z.string(), z.any())])),
	operation: withExpr(z.enum(["remove_nulls", "remove_empty", "pick_keys", "omit_keys", "filter_array"])),
	keys: withExpr(z.array(z.string())),
	condition: withExpr(z.string()),
} as const;

export const filterNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.filter"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Input Data"),
				name: z.literal("input_data"),
				type: z.literal("textarea"),
				value: filterNodeValueSchemas.input_data,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: filterNodeValueSchemas.operation,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
		nodeParameterSchema.extend({
			label: z.literal("Keys"),
			name: z.literal("keys"),
			type: z.literal("array"),
			value: filterNodeValueSchemas.keys,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["pick_keys", "omit_keys"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Condition"),
				name: z.literal("condition"),
				type: z.literal("input"),
				value: filterNodeValueSchemas.condition,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("filter_array")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
