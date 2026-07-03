import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const airtableNodeValueSchemas = {
	operation: withExpr(z.string()),
	baseId: withExpr(z.string()),
	tableName: withExpr(z.string()),
	recordId: withExpr(z.string()),
	fields: withExpr(z.string()),
	filterByFormula: withExpr(z.string()),
	sort: withExpr(z.string()),
	maxRecords: withExpr(z.string()),
} as const;

export const airtableNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.airtable"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: airtableNodeValueSchemas.operation,
				default: z.literal("list_records").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "List Records", value: "list_records" },
						{ label: "Get Record", value: "get_record" },
						{ label: "Create Record", value: "create_record" },
						{ label: "Update Record", value: "update_record" },
						{ label: "Delete Record", value: "delete_record" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Base ID"),
				name: z.literal("baseId"),
				type: z.literal("input"),
				value: airtableNodeValueSchemas.baseId,
				required: z.boolean(),
				description: z.string().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Table Name"),
				name: z.literal("tableName"),
				type: z.literal("input"),
				value: airtableNodeValueSchemas.tableName,
				required: z.boolean(),
				description: z.string().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Record ID"),
				name: z.literal("recordId"),
				type: z.literal("input"),
				value: airtableNodeValueSchemas.recordId,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("get_record"),
									z.literal("update_record"),
									z.literal("delete_record"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Fields (JSON)"),
				name: z.literal("fields"),
				type: z.literal("textarea"),
				value: airtableNodeValueSchemas.fields,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("create_record"),
									z.literal("update_record"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Filter Formula"),
				name: z.literal("filterByFormula"),
				type: z.literal("input"),
				value: airtableNodeValueSchemas.filterByFormula,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_records")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Sort"),
				name: z.literal("sort"),
				type: z.literal("input"),
				value: airtableNodeValueSchemas.sort,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_records")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Max Records"),
				name: z.literal("maxRecords"),
				type: z.literal("input"),
				value: airtableNodeValueSchemas.maxRecords,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_records")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
