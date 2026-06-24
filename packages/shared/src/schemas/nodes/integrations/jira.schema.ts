import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const jiraNodeValueSchemas = {
	operation: withExpr(z.string()),
	project_key: withExpr(z.string().max(2000)),
	issue_key: withExpr(z.string().max(2000)),
	summary: withExpr(z.string().max(2000)),
	description: withExpr(z.string().max(10000)),
	issue_type: withExpr(z.string()),
	status: withExpr(z.string()),
	priority: withExpr(z.string()),
	assignee: withExpr(z.string().max(2000)),
	labels: withExpr(z.string().max(2000)),
	jql: withExpr(z.string().max(10000)),
	max_results: withExpr(z.coerce.number().int().min(1).max(100)),
	transition_id: withExpr(z.string().max(2000)),
	comment: withExpr(z.string().max(10000)),
} as const;

export const jiraNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.jira"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: jiraNodeValueSchemas.operation,
				default: z.literal("create_issue").optional(),
				options: z
					.array(
						z.object({
							label: z.string(),
							value: z.string(),
							groupLabel: z.string().optional(),
						}),
					)
					.default([
						{ label: "Create Issue", value: "create_issue", groupLabel: "issue" },
						{ label: "Update Issue", value: "update_issue", groupLabel: "issue" },
						{ label: "Get Issue", value: "get_issue", groupLabel: "issue" },
						{ label: "List Issues", value: "list_issues", groupLabel: "issue" },
						{ label: "Transition Issue", value: "transition_issue", groupLabel: "issue" },
					]),
				required: z.boolean(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Project Key"),
				name: z.literal("project_key"),
				type: z.literal("input"),
				value: jiraNodeValueSchemas.project_key,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_issue", "list_issues"])),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Issue Key"),
				name: z.literal("issue_key"),
				type: z.literal("input"),
				value: jiraNodeValueSchemas.issue_key,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["get_issue", "update_issue", "transition_issue"])),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Summary"),
				name: z.literal("summary"),
				type: z.literal("input"),
				value: jiraNodeValueSchemas.summary,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_issue")),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Description"),
				name: z.literal("description"),
				type: z.literal("textarea"),
				value: jiraNodeValueSchemas.description,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_issue", "update_issue"])),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Issue Type"),
				name: z.literal("issue_type"),
				type: z.literal("dropdown"),
				value: jiraNodeValueSchemas.issue_type,
				default: z.literal("Task").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Task", value: "Task" },
						{ label: "Story", value: "Story" },
						{ label: "Bug", value: "Bug" },
						{ label: "Epic", value: "Epic" },
						{ label: "Sub-task", value: "Sub-task" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_issue")),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Status"),
				name: z.literal("status"),
				type: z.literal("dropdown"),
				value: jiraNodeValueSchemas.status,
				default: z.literal("To Do").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "To Do", value: "To Do" },
						{ label: "In Progress", value: "In Progress" },
						{ label: "Done", value: "Done" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("update_issue")),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Priority"),
				name: z.literal("priority"),
				type: z.literal("dropdown"),
				value: jiraNodeValueSchemas.priority,
				default: z.literal("Medium").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Highest", value: "Highest" },
						{ label: "High", value: "High" },
						{ label: "Medium", value: "Medium" },
						{ label: "Low", value: "Low" },
						{ label: "Lowest", value: "Lowest" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_issue", "update_issue"])),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Assignee"),
				name: z.literal("assignee"),
				type: z.literal("input"),
				value: jiraNodeValueSchemas.assignee,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_issue", "update_issue"])),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Labels"),
				name: z.literal("labels"),
				type: z.literal("input"),
				value: jiraNodeValueSchemas.labels,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_issue", "update_issue"])),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("JQL Query"),
				name: z.literal("jql"),
				type: z.literal("textarea"),
				value: jiraNodeValueSchemas.jql,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_issues")),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Max Results"),
				name: z.literal("max_results"),
				type: z.literal("number"),
				value: jiraNodeValueSchemas.max_results,
				default: z.literal("50").optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_issues")),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Transition ID"),
				name: z.literal("transition_id"),
				type: z.literal("input"),
				value: jiraNodeValueSchemas.transition_id,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("transition_issue")),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Comment"),
				name: z.literal("comment"),
				type: z.literal("textarea"),
				value: jiraNodeValueSchemas.comment,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("transition_issue")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
