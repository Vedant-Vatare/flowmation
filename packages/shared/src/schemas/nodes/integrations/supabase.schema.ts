import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const supabaseNodeValueSchemas = {
	operation: withExpr(z.string()),
	table: withExpr(z.string()),
	selectColumns: withExpr(z.string()),
	filter: withExpr(z.string()),
	data: withExpr(z.string()),
	orderBy: withExpr(z.string()),
	limit: withExpr(z.string()),
	offset: withExpr(z.string()),
	functionName: withExpr(z.string()),
	functionBody: withExpr(z.string()),
} as const;

export const supabaseNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.supabase"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: supabaseNodeValueSchemas.operation,
				default: z.literal("query_rows").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Query Rows", value: "query_rows" },
						{ label: "Insert Rows", value: "insert_rows" },
						{ label: "Update Rows", value: "update_rows" },
						{ label: "Delete Rows", value: "delete_rows" },
						{ label: "Upsert Rows", value: "upsert_rows" },
						{ label: "Invoke Function", value: "invoke_function" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Table Name"),
				name: z.literal("table"),
				type: z.literal("input"),
				value: supabaseNodeValueSchemas.table,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("query_rows"),
									z.literal("insert_rows"),
									z.literal("update_rows"),
									z.literal("delete_rows"),
									z.literal("upsert_rows"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Select Columns"),
				name: z.literal("selectColumns"),
				type: z.literal("input"),
				value: supabaseNodeValueSchemas.selectColumns,
				default: z.literal("*").optional(),
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("query_rows")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Filter"),
				name: z.literal("filter"),
				type: z.literal("input"),
				value: supabaseNodeValueSchemas.filter,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("query_rows"),
									z.literal("update_rows"),
									z.literal("delete_rows"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Data"),
				name: z.literal("data"),
				type: z.literal("textarea"),
				value: supabaseNodeValueSchemas.data,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("insert_rows"),
									z.literal("update_rows"),
									z.literal("upsert_rows"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Order By"),
				name: z.literal("orderBy"),
				type: z.literal("input"),
				value: supabaseNodeValueSchemas.orderBy,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("query_rows")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("input"),
				value: supabaseNodeValueSchemas.limit,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("query_rows")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Offset"),
				name: z.literal("offset"),
				type: z.literal("input"),
				value: supabaseNodeValueSchemas.offset,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("query_rows")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Function Name"),
				name: z.literal("functionName"),
				type: z.literal("input"),
				value: supabaseNodeValueSchemas.functionName,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("invoke_function")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Function Body"),
				name: z.literal("functionBody"),
				type: z.literal("textarea"),
				value: supabaseNodeValueSchemas.functionBody,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("invoke_function")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
