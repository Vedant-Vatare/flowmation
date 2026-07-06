import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const firebaseNodeValueSchemas = {
	operation: withExpr(z.string()),
	path: withExpr(z.string()),
	data: withExpr(z.string()),
} as const;

export const firebaseNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.firebase"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: firebaseNodeValueSchemas.operation,
				default: z.literal("read_data").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Read Data", value: "read_data" },
						{ label: "Write Data", value: "write_data" },
						{ label: "Push Data", value: "push_data" },
						{ label: "Update Data", value: "update_data" },
						{ label: "Delete Data", value: "delete_data" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Path"),
				name: z.literal("path"),
				type: z.literal("input"),
				value: firebaseNodeValueSchemas.path,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Data"),
				name: z.literal("data"),
				type: z.literal("textarea"),
				value: firebaseNodeValueSchemas.data,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("write_data"),
									z.literal("push_data"),
									z.literal("update_data"),
								]),
							),
						}),
					)
					.optional(),
			}),
		]),
	),
});
