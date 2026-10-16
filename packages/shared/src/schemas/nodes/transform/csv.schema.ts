import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const csvNodeValueSchemas = {
	operation: withExpr(z.enum(["parse", "generate"])),
	input_data: withExpr(
		z.union([
			z.string(),
			z.array(z.unknown()),
			z.record(z.string(), z.unknown()),
		]),
	),
	delimiter: withExpr(z.enum([",", ";", "\t", "|"])),
	header: withExpr(z.boolean()),
	escape_formulas: withExpr(z.boolean()),
} as const;

export const csvNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.csv"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("operation"),
				label: z.literal("Operation"),
				type: z.literal("dropdown"),
				value: csvNodeValueSchemas.operation,
				required: z.boolean(),
				options: nodeParameterSchema.shape.options,
			}),
			nodeParameterSchema.extend({
				name: z.literal("input_data"),
				label: z.literal("Input Data"),
				type: z.literal("textarea"),
				value: csvNodeValueSchemas.input_data,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("delimiter"),
				label: z.literal("Delimiter"),
				type: z.literal("dropdown"),
				value: csvNodeValueSchemas.delimiter,
				required: z.boolean(),
				options: nodeParameterSchema.shape.options,
			}),
			nodeParameterSchema.extend({
				name: z.literal("header"),
				label: z.literal("Header Row"),
				type: z.literal("boolean"),
				value: csvNodeValueSchemas.header,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("escape_formulas"),
				label: z.literal("Escape Formulas"),
				type: z.literal("boolean"),
				value: csvNodeValueSchemas.escape_formulas,
				required: z.boolean(),
				dependsOn: nodeParameterSchema.shape.dependsOn,
			}),
		]),
	),
});
