import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const linearNodeValueSchemas = {
	operation: withExpr(z.string()),
	team_id: withExpr(z.string().max(2000)),
	issue_id: withExpr(z.string().max(2000)),
	title: withExpr(z.string().max(2000)),
	description: withExpr(z.string().max(10000)),
	priority: withExpr(z.coerce.number().int().min(0).max(4)),
	assignee_id: withExpr(z.string().max(2000)),
	state_id: withExpr(z.string().max(2000)),
	labels: withExpr(z.string().max(2000)),
	filter: withExpr(z.string().max(10000)),
	limit: withExpr(z.coerce.number().int().min(1).max(250)),
} as const;

export const linearNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.linear"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: linearNodeValueSchemas.operation,
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
						{ label: "List Teams", value: "list_teams", groupLabel: "team" },
					]),
				required: z.boolean(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Team ID"),
				name: z.literal("team_id"),
				type: z.literal("input"),
				value: linearNodeValueSchemas.team_id,
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
				label: z.literal("Issue ID"),
				name: z.literal("issue_id"),
				type: z.literal("input"),
				value: linearNodeValueSchemas.issue_id,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["get_issue", "update_issue"])),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Title"),
				name: z.literal("title"),
				type: z.literal("input"),
				value: linearNodeValueSchemas.title,
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
				value: linearNodeValueSchemas.description,
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
				label: z.literal("Priority"),
				name: z.literal("priority"),
				type: z.literal("dropdown"),
				value: linearNodeValueSchemas.priority,
				default: z.literal("3").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "No Priority", value: "0" },
						{ label: "Urgent", value: "1" },
						{ label: "High", value: "2" },
						{ label: "Medium", value: "3" },
						{ label: "Low", value: "4" },
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
				label: z.literal("Assignee ID"),
				name: z.literal("assignee_id"),
				type: z.literal("input"),
				value: linearNodeValueSchemas.assignee_id,
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
				label: z.literal("State ID"),
				name: z.literal("state_id"),
				type: z.literal("input"),
				value: linearNodeValueSchemas.state_id,
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
				label: z.literal("Labels"),
				name: z.literal("labels"),
				type: z.literal("input"),
				value: linearNodeValueSchemas.labels,
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
				label: z.literal("Filter"),
				name: z.literal("filter"),
				type: z.literal("textarea"),
				value: linearNodeValueSchemas.filter,
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
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("number"),
				value: linearNodeValueSchemas.limit,
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
		]),
	),
});
