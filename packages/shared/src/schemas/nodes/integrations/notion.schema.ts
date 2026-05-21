import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

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
				value: z.string(),
				default: z.literal("create_database_row"),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Database Row", value: "create_database_row" },
						{ label: "Create Page", value: "create_page" },
						{ label: "Append to Page", value: "append_blocks" },
					]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("databaseId"),
				label: z.literal("database ID"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_database_row"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("parentPageId"),
				label: z.literal("parent page ID"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_page"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("pageId"),
				label: z.literal("page ID"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["append_blocks"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("title"),
				label: z.literal("title"),
				type: z.literal("input"),
				value: z.string(),
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
				value: z.string(),
				required: z.boolean().default(false),
				dependsOn: dependsOnSchema.default([
					{
						parameter: "operation",
						values: ["create_page", "append_blocks"],
					},
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("properties"),
				label: z.literal("properties"),
				type: z.literal("textarea"),
				value: z.string(),
				required: z.boolean().default(false),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_database_row"] },
				]),
			}),
		]),
	),
});
