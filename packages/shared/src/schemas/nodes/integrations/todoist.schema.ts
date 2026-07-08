import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const todoistNodeValueSchemas = {
	operation: withExpr(z.string()),
	content: withExpr(z.string()),
	task_id: withExpr(z.string()),
	project_id: withExpr(z.string()),
	description: withExpr(z.string()),
	priority: withExpr(z.string()),
	due_string: withExpr(z.string()),
	labels: withExpr(z.string()),
} as const;

export const todoistNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.todoist"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: todoistNodeValueSchemas.operation,
				default: z.literal("create_task").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Task", value: "create_task" },
						{ label: "Get Task", value: "get_task" },
						{ label: "Update Task", value: "update_task" },
						{ label: "Complete Task", value: "complete_task" },
						{ label: "Delete Task", value: "delete_task" },
						{ label: "List Projects", value: "list_projects" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Content"),
				name: z.literal("content"),
				type: z.literal("textarea"),
				value: todoistNodeValueSchemas.content,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_task", "update_task"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Task ID"),
				name: z.literal("task_id"),
				type: z.literal("input"),
				value: todoistNodeValueSchemas.task_id,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum([
									"get_task",
									"update_task",
									"complete_task",
									"delete_task",
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Project ID"),
				name: z.literal("project_id"),
				type: z.literal("input"),
				value: todoistNodeValueSchemas.project_id,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_task"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Description"),
				name: z.literal("description"),
				type: z.literal("textarea"),
				value: todoistNodeValueSchemas.description,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_task", "update_task"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Priority"),
				name: z.literal("priority"),
				type: z.literal("number"),
				value: todoistNodeValueSchemas.priority,
				default: z.literal("1").optional(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_task", "update_task"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Due Date"),
				name: z.literal("due_string"),
				type: z.literal("input"),
				value: todoistNodeValueSchemas.due_string,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_task", "update_task"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Labels"),
				name: z.literal("labels"),
				type: z.literal("input"),
				value: todoistNodeValueSchemas.labels,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_task", "update_task"])),
						}),
					)
					.optional(),
			}),
		]),
	),
});
