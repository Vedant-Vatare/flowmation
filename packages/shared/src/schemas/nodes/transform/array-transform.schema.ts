import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const arrayTransformNodeValueSchemas = {
	input_array: withExpr(z.union([z.string(), z.array(z.any())])),
	operation: withExpr(z.enum(["map", "filter", "sort", "flatten", "deduplicate", "first", "last", "slice", "reverse"])),
	expression: withExpr(z.string()),
	sort_direction: withExpr(z.enum(["asc", "desc"])),
	limit: withExpr(z.coerce.number().min(1)),
	start: withExpr(z.coerce.number().min(0)),
} as const;

export const arrayTransformNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.array_transform"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Input Array"),
				name: z.literal("input_array"),
				type: z.literal("textarea"),
				value: arrayTransformNodeValueSchemas.input_array,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: arrayTransformNodeValueSchemas.operation,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Expression"),
				name: z.literal("expression"),
				type: z.literal("input"),
				value: arrayTransformNodeValueSchemas.expression,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["map", "filter"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Sort Direction"),
				name: z.literal("sort_direction"),
				type: z.literal("dropdown"),
				value: arrayTransformNodeValueSchemas.sort_direction,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("sort")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("number"),
				value: arrayTransformNodeValueSchemas.limit,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["first", "last", "slice"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Start"),
				name: z.literal("start"),
				type: z.literal("number"),
				value: arrayTransformNodeValueSchemas.start,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("slice")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
