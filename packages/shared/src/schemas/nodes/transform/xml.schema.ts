import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const xmlNodeValueSchemas = {
	operation: withExpr(z.enum(["parse", "generate"])),
	input_data: withExpr(
		z.union([
			z.string(),
			z.array(z.unknown()),
			z.record(z.string(), z.unknown()),
		]),
	),
	root_name: withExpr(z.string().max(200)),
} as const;

export const xmlNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.xml"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("operation"),
				label: z.literal("Operation"),
				type: z.literal("dropdown"),
				value: xmlNodeValueSchemas.operation,
				required: z.boolean(),
				options: nodeParameterSchema.shape.options,
			}),
			nodeParameterSchema.extend({
				name: z.literal("input_data"),
				label: z.literal("Input Data"),
				type: z.literal("textarea"),
				value: xmlNodeValueSchemas.input_data,
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				name: z.literal("root_name"),
				label: z.literal("Root Element"),
				type: z.literal("input"),
				value: xmlNodeValueSchemas.root_name,
				required: z.boolean(),
				dependsOn: nodeParameterSchema.shape.dependsOn,
			}),
		]),
	),
});
