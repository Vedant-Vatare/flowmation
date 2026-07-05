import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const asanaNodeValueSchemas = {
	operation: withExpr(z.string()),
	workspaceGid: withExpr(z.string()),
	projectGid: withExpr(z.string()),
	taskGid: withExpr(z.string()),
	name: withExpr(z.string()),
	notes: withExpr(z.string()),
	dueOn: withExpr(z.string()),
	completed: withExpr(z.string()),
	limit: withExpr(z.string()),
} as const;

export const asanaNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.asana"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: asanaNodeValueSchemas.operation,
				default: z.literal("list_workspaces").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "List Workspaces", value: "list_workspaces" },
						{ label: "List Projects", value: "list_projects" },
						{ label: "List Tasks", value: "list_tasks" },
						{ label: "Get Task", value: "get_task" },
						{ label: "Create Task", value: "create_task" },
						{ label: "Update Task", value: "update_task" },
						{ label: "Complete Task", value: "complete_task" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Workspace GID"),
				name: z.literal("workspaceGid"),
				type: z.literal("input"),
				value: asanaNodeValueSchemas.workspaceGid,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("list_projects"),
									z.literal("create_task"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Project GID"),
				name: z.literal("projectGid"),
				type: z.literal("input"),
				value: asanaNodeValueSchemas.projectGid,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("list_tasks"),
									z.literal("create_task"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Task GID"),
				name: z.literal("taskGid"),
				type: z.literal("input"),
				value: asanaNodeValueSchemas.taskGid,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("get_task"),
									z.literal("update_task"),
									z.literal("complete_task"),
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
				value: asanaNodeValueSchemas.name,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_task")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Notes"),
				name: z.literal("notes"),
				type: z.literal("textarea"),
				value: asanaNodeValueSchemas.notes,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_task")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Due Date"),
				name: z.literal("dueOn"),
				type: z.literal("input"),
				value: asanaNodeValueSchemas.dueOn,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_task")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Completed"),
				name: z.literal("completed"),
				type: z.literal("dropdown"),
				value: asanaNodeValueSchemas.completed,
				default: z.literal("true").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "True", value: "true" },
						{ label: "False", value: "false" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("update_task")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("input"),
				value: asanaNodeValueSchemas.limit,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("list_workspaces"),
									z.literal("list_projects"),
									z.literal("list_tasks"),
								]),
							),
						}),
					)
					.optional(),
			}),
		]),
	),
});
