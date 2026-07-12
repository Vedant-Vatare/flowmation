import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const mongodbNodeValueSchemas = {
	operation: withExpr(z.string()),
	database: withExpr(z.string()),
	collection: withExpr(z.string()),
	filter: withExpr(z.string()),
	document: withExpr(z.string()),
	update: withExpr(z.string()),
	projection: withExpr(z.string()),
} as const;

export const mongodbNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.mongodb"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: mongodbNodeValueSchemas.operation,
				default: z.literal("find").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Find", value: "find" },
						{ label: "Find One", value: "findOne" },
						{ label: "Insert One", value: "insertOne" },
						{ label: "Insert Many", value: "insertMany" },
						{ label: "Update One", value: "updateOne" },
						{ label: "Update Many", value: "updateMany" },
						{ label: "Delete One", value: "deleteOne" },
						{ label: "Delete Many", value: "deleteMany" },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Database"),
				name: z.literal("database"),
				type: z.literal("input"),
				value: mongodbNodeValueSchemas.database,
				required: z.boolean().default(true),
				description: z.literal("Database name"),
				placeholder: z.literal("mydb"),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Collection"),
				name: z.literal("collection"),
				type: z.literal("input"),
				value: mongodbNodeValueSchemas.collection,
				required: z.boolean().default(true),
				description: z.literal("Collection name"),
				placeholder: z.literal("users"),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Filter"),
				name: z.literal("filter"),
				type: z.literal("textarea"),
				value: mongodbNodeValueSchemas.filter,
				required: z.boolean().default(false),
				description: z.literal(
					"JSON filter/query for find, update, and delete operations",
				),
				placeholder: z.literal('{ "status": "active" }'),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{
							parameter: "operation",
							values: [
								"find",
								"findOne",
								"updateOne",
								"updateMany",
								"deleteOne",
								"deleteMany",
							],
						},
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Document"),
				name: z.literal("document"),
				type: z.literal("textarea"),
				value: mongodbNodeValueSchemas.document,
				required: z.boolean().default(true),
				description: z.literal("JSON document to insert"),
				placeholder: z.literal(
					'{ "name": "John", "email": "john@example.com" }',
				),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "operation", values: ["insertOne", "insertMany"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Update"),
				name: z.literal("update"),
				type: z.literal("textarea"),
				value: mongodbNodeValueSchemas.update,
				required: z.boolean().default(true),
				description: z.literal(
					"JSON update operations (e.g., { $set: { ... } })",
				),
				placeholder: z.literal('{ "$set": { "status": "inactive" } }'),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "operation", values: ["updateOne", "updateMany"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Projection"),
				name: z.literal("projection"),
				type: z.literal("textarea"),
				value: mongodbNodeValueSchemas.projection,
				required: z.boolean().default(false),
				description: z.literal(
					"JSON projection to limit returned fields (e.g., { name: 1, _id: 0 })",
				),
				placeholder: z.literal('{ "name": 1, "email": 1 }'),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([{ parameter: "operation", values: ["find", "findOne"] }]),
			}),
		]),
	),
});
