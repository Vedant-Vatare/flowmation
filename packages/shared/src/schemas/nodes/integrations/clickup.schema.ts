import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const clickupNodeValueSchemas = {
	operation: withExpr(z.string()),
	listId: withExpr(z.string()),
	taskId: withExpr(z.string()),
	name: withExpr(z.string()),
	description: withExpr(z.string()),
	status: withExpr(z.string()),
	priority: withExpr(z.coerce.number()),
	commentText: withExpr(z.string()),
	limit: withExpr(z.string()),
} as const;

export const clickupNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.clickup"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: clickupNodeValueSchemas.operation,
				default: z.literal("create_task").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Task", value: "create_task" },
						{ label: "Update Task", value: "update_task" },
						{ label: "Get Task", value: "get_task" },
						{ label: "List Tasks", value: "list_tasks" },
						{ label: "Add Comment", value: "add_comment" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("List ID"),
				name: z.literal("listId"),
				type: z.literal("input"),
				value: clickupNodeValueSchemas.listId,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("create_task"), z.literal("list_tasks")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Task ID"),
				name: z.literal("taskId"),
				type: z.literal("input"),
				value: clickupNodeValueSchemas.taskId,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("update_task"),
									z.literal("get_task"),
									z.literal("add_comment"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Task Name"),
				name: z.literal("name"),
				type: z.literal("input"),
				value: clickupNodeValueSchemas.name,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("create_task"), z.literal("update_task")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Description"),
				name: z.literal("description"),
				type: z.literal("textarea"),
				value: clickupNodeValueSchemas.description,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("create_task"), z.literal("update_task")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Status"),
				name: z.literal("status"),
				type: z.literal("input"),
				value: clickupNodeValueSchemas.status,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("create_task"), z.literal("update_task")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Priority"),
				name: z.literal("priority"),
				type: z.literal("number"),
				value: clickupNodeValueSchemas.priority,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("create_task"), z.literal("update_task")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Comment"),
				name: z.literal("commentText"),
				type: z.literal("textarea"),
				value: clickupNodeValueSchemas.commentText,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("add_comment")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("input"),
				value: clickupNodeValueSchemas.limit,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_tasks")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
