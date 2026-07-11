import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const postgresNodeValueSchemas = {
	query: withExpr(z.string()),
	parameters: withExpr(z.string()),
} as const;

export const postgresNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.postgres"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Query"),
				name: z.literal("query"),
				type: z.literal("textarea"),
				value: postgresNodeValueSchemas.query,
				required: z.boolean(),
				description: z.literal("SQL query to execute. Use $1, $2, etc. for parameterized queries."),
				placeholder: z.literal("SELECT * FROM users WHERE id = $1 AND status = $2"),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Parameters"),
				name: z.literal("parameters"),
				type: z.literal("input"),
				value: postgresNodeValueSchemas.parameters,
				required: z.boolean().default(false),
				description: z.literal("Comma-separated values for $1, $2, etc."),
				placeholder: z.literal("123, active"),
			}),
		]),
	),
});
