import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const notionNodeValueSchemas = {
	operation: withExpr(z.string()),
	pageId: withExpr(z.string()),
	parentPageId: withExpr(z.string()),
	title: withExpr(z.string()),
	content: withExpr(z.string()),
	databaseId: withExpr(z.string()),
	properties: withExpr(z.string()),
} as const;

const dependsOnSchema = z.array(
	z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
);

export const notionNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.notion"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("operation"),
				label: z.literal("operation"),
				type: z.literal("dropdown"),
				value: notionNodeValueSchemas.operation,
				default: z.literal("get_page_content"),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Get Page Content", value: "get_page_content" },
						{ label: "Create Page", value: "create_page" },
						{ label: "Append to Page", value: "append_blocks" },
						{ label: "Create Database Row", value: "create_database_row" },
					]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("pageId"),
				label: z.literal("page ID"),
				type: z.literal("input"),
				value: notionNodeValueSchemas.pageId,
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{
						parameter: "operation",
						values: ["append_blocks", "get_page_content"],
					},
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("parentPageId"),
				label: z.literal("parent page ID"),
				type: z.literal("input"),
				value: notionNodeValueSchemas.parentPageId,
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_page"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("title"),
				label: z.literal("title"),
				type: z.literal("input"),
				value: notionNodeValueSchemas.title,
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{
						parameter: "operation",
						values: ["create_database_row", "create_page"],
					},
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("content"),
				label: z.literal("content"),
				type: z.literal("textarea"),
				value: notionNodeValueSchemas.content,
				required: z.boolean().default(false),
				dependsOn: dependsOnSchema.default([
					{
						parameter: "operation",
						values: ["create_page", "append_blocks"],
					},
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("databaseId"),
				label: z.literal("database ID"),
				type: z.literal("input"),
				value: notionNodeValueSchemas.databaseId,
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_database_row"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("properties"),
				label: z.literal("properties"),
				type: z.literal("textarea"),
				value: notionNodeValueSchemas.properties,
				required: z.boolean().default(false),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_database_row"] },
				]),
			}),
		]),
	),
});
