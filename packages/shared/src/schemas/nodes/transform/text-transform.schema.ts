import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const textTransformNodeValueSchemas = {
	input_text: withExpr(z.string()),
	operation: withExpr(
		z.enum([
			"uppercase",
			"lowercase",
			"trim",
			"replace",
			"substring",
			"concat",
			"split",
			"template",
			"length",
		]),
	),
	value: withExpr(z.string()),
	replacement: withExpr(z.string()),
	start: withExpr(z.coerce.number().min(0)),
	end: withExpr(z.coerce.number().min(0)),
	delimiter: withExpr(z.string()),
	template: withExpr(z.string()),
} as const;

export const textTransformNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.text_transform"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Input Text"),
				name: z.literal("input_text"),
				type: z.literal("textarea"),
				value: textTransformNodeValueSchemas.input_text,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: textTransformNodeValueSchemas.operation,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Value"),
				name: z.literal("value"),
				type: z.literal("input"),
				value: textTransformNodeValueSchemas.value,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["replace", "split", "concat"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Replacement"),
				name: z.literal("replacement"),
				type: z.literal("input"),
				value: textTransformNodeValueSchemas.replacement,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("replace")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Start"),
				name: z.literal("start"),
				type: z.literal("number"),
				value: textTransformNodeValueSchemas.start,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("substring")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("End"),
				name: z.literal("end"),
				type: z.literal("number"),
				value: textTransformNodeValueSchemas.end,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("substring")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Delimiter"),
				name: z.literal("delimiter"),
				type: z.literal("input"),
				value: textTransformNodeValueSchemas.delimiter,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("split")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Template"),
				name: z.literal("template"),
				type: z.literal("textarea"),
				value: textTransformNodeValueSchemas.template,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("template")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
