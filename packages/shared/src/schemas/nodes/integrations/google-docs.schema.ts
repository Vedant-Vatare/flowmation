import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const googleDocsNodeValueSchemas = {
	operation: withExpr(z.string()),
	documentId: withExpr(z.string()),
	title: withExpr(z.string()),
	text: withExpr(z.string()),
	findText: withExpr(z.string()),
	replaceText: withExpr(z.string()),
	query: withExpr(z.string()),
	pageSize: withExpr(z.string()),
} as const;

export const googleDocsNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.google_docs"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: googleDocsNodeValueSchemas.operation,
				default: z.literal("create_document").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Document", value: "create_document" },
						{ label: "Get Document", value: "get_document" },
						{ label: "Append Text", value: "append_text" },
						{ label: "Replace Text", value: "replace_text" },
						{ label: "Delete Document", value: "delete_document" },
						{ label: "Search Documents", value: "search_documents" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Document ID"),
				name: z.literal("documentId"),
				type: z.literal("input"),
				value: googleDocsNodeValueSchemas.documentId,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum([
									"get_document",
									"append_text",
									"replace_text",
									"delete_document",
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Title"),
				name: z.literal("title"),
				type: z.literal("input"),
				value: googleDocsNodeValueSchemas.title,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_document"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Text to Append"),
				name: z.literal("text"),
				type: z.literal("textarea"),
				value: googleDocsNodeValueSchemas.text,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["append_text"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Find Text"),
				name: z.literal("findText"),
				type: z.literal("input"),
				value: googleDocsNodeValueSchemas.findText,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["replace_text"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Replace With"),
				name: z.literal("replaceText"),
				type: z.literal("input"),
				value: googleDocsNodeValueSchemas.replaceText,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["replace_text"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Search Query"),
				name: z.literal("query"),
				type: z.literal("input"),
				value: googleDocsNodeValueSchemas.query,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["search_documents"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Max Results"),
				name: z.literal("pageSize"),
				type: z.literal("number"),
				value: googleDocsNodeValueSchemas.pageSize,
				default: z.literal("10").optional(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["search_documents"])),
						}),
					)
					.optional(),
			}),
		]),
	),
});
