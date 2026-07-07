import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const jsonTransformNodeValueSchemas = {
	input_data: withExpr(
		z.union([z.string(), z.record(z.string(), z.any()), z.array(z.any())]),
	),
	operation: withExpr(z.enum(["extract", "rename_keys", "pick_keys", "omit_keys", "flatten", "nest"])),
	extract_path: withExpr(z.string()),
	keys_mapping: withExpr(z.record(z.string(), z.string())),
	keys: withExpr(z.array(z.string())),
	delimiter: withExpr(z.string()),
} as const;

export const jsonTransformNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.json_transform"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Input Data"),
				name: z.literal("input_data"),
				type: z.literal("textarea"),
				value: jsonTransformNodeValueSchemas.input_data,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: jsonTransformNodeValueSchemas.operation,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Extract Path"),
				name: z.literal("extract_path"),
				type: z.literal("input"),
				value: jsonTransformNodeValueSchemas.extract_path,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("extract")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Keys Mapping"),
				name: z.literal("keys_mapping"),
				type: z.literal("key-value"),
				value: jsonTransformNodeValueSchemas.keys_mapping,
				required: z.boolean(),
				multiValued: z.boolean().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("rename_keys")),
						}),
					)
					.optional(),
			}),
		nodeParameterSchema.extend({
			label: z.literal("Keys"),
			name: z.literal("keys"),
			type: z.literal("array"),
			value: jsonTransformNodeValueSchemas.keys,
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
				label: z.literal("Delimiter"),
				name: z.literal("delimiter"),
				type: z.literal("input"),
				value: jsonTransformNodeValueSchemas.delimiter,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("flatten")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
