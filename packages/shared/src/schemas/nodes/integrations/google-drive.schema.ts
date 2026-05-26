import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const googleDriveNodeValueSchemas = {
	operation: withExpr(z.string()),
	query: withExpr(z.string().max(2000)),
	pageSize: withExpr(z.coerce.number().int().min(1).max(1000)),
	fileId: withExpr(z.string().max(2000)),
	fileName: withExpr(z.string().max(2000)),
	parentFolderId: withExpr(z.string().max(2000)),
	mimeType: withExpr(z.string().max(200)),
	fileContent: withExpr(z.string().max(10000)),
} as const;

export const googleDriveNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.google_drive"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: googleDriveNodeValueSchemas.operation,
				default: z.literal("list_files").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "List Files", value: "list_files" },
						{ label: "Get File", value: "get_file" },
						{ label: "Upload File", value: "upload_file" },
						{ label: "Update File", value: "update_file" },
						{ label: "Delete File", value: "delete_file" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Search Query"),
				name: z.literal("query"),
				type: z.literal("input"),
				value: googleDriveNodeValueSchemas.query,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_files")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Page Size"),
				name: z.literal("pageSize"),
				type: z.literal("number"),
				value: googleDriveNodeValueSchemas.pageSize,
				default: z.literal("10").optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_files")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("File ID"),
				name: z.literal("fileId"),
				type: z.literal("input"),
				value: googleDriveNodeValueSchemas.fileId,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["get_file", "update_file", "delete_file"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("File Name"),
				name: z.literal("fileName"),
				type: z.literal("input"),
				value: googleDriveNodeValueSchemas.fileName,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["upload_file", "update_file"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Parent Folder ID"),
				name: z.literal("parentFolderId"),
				type: z.literal("input"),
				value: googleDriveNodeValueSchemas.parentFolderId,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("upload_file")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("MIME Type"),
				name: z.literal("mimeType"),
				type: z.literal("input"),
				value: googleDriveNodeValueSchemas.mimeType,
				default: z.literal("text/plain").optional(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["upload_file", "update_file"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("File Content"),
				name: z.literal("fileContent"),
				type: z.literal("textarea"),
				value: googleDriveNodeValueSchemas.fileContent,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["upload_file", "update_file"])),
						}),
					)
					.optional(),
			}),
		]),
	),
});
