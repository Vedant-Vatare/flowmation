import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const gitHubNodeValueSchemas = {
	operation: withExpr(z.string()),
	owner: withExpr(z.string().max(2000)),
	repo: withExpr(z.string().max(2000)),
	type: withExpr(z.string()),
	issue_number: withExpr(z.string().max(2000)),
	title: withExpr(z.string().max(2000)),
	body: withExpr(z.string().max(10000)),
	state: withExpr(z.string()),
	labels: withExpr(z.string().max(2000)),
	assignees: withExpr(z.string().max(2000)),
	assignee: withExpr(z.string().max(2000)),
	pull_number: withExpr(z.string().max(2000)),
	base: withExpr(z.string().max(2000)),
	per_page: withExpr(z.coerce.number().int().min(1).max(100)),
} as const;

export const gitHubNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.github"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: gitHubNodeValueSchemas.operation,
				default: z.literal("get_repository").optional(),
				options: z
					.array(
						z.object({
							label: z.string(),
							value: z.string(),
							groupLabel: z.string().optional(),
						}),
					)
					.default([
						{
							label: "Get Repository",
							value: "get_repository",
							groupLabel: "repository",
						},
						{
							label: "List User Repos",
							value: "list_repos",
							groupLabel: "repository",
						},
						{ label: "List Issues", value: "list_issues", groupLabel: "issue" },
						{ label: "Get Issue", value: "get_issue", groupLabel: "issue" },
						{
							label: "Create Issue",
							value: "create_issue",
							groupLabel: "issue",
						},
						{
							label: "Update Issue",
							value: "update_issue",
							groupLabel: "issue",
						},
						{
							label: "List Pull Requests",
							value: "list_prs",
							groupLabel: "pull request",
						},
						{
							label: "Get Pull Request",
							value: "get_pr",
							groupLabel: "pull request",
						},
					]),
				required: z.boolean(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Owner"),
				name: z.literal("owner"),
				type: z.literal("input"),
				value: gitHubNodeValueSchemas.owner,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum([
									"get_repository",
									"list_issues",
									"get_issue",
									"create_issue",
									"update_issue",
									"list_prs",
									"get_pr",
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Repository"),
				name: z.literal("repo"),
				type: z.literal("input"),
				value: gitHubNodeValueSchemas.repo,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum([
									"get_repository",
									"list_issues",
									"get_issue",
									"create_issue",
									"update_issue",
									"list_prs",
									"get_pr",
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Type"),
				name: z.literal("type"),
				type: z.literal("dropdown"),
				value: gitHubNodeValueSchemas.type,
				default: z.literal("all").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "All", value: "all" },
						{ label: "Owner", value: "owner" },
						{ label: "Public", value: "public" },
						{ label: "Private", value: "private" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_repos")),
						}),
					)
					.optional(),
			}),

			nodeParameterSchema.extend({
				label: z.literal("Issue Number"),
				name: z.literal("issue_number"),
				type: z.literal("input"),
				value: gitHubNodeValueSchemas.issue_number,
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
				value: gitHubNodeValueSchemas.title,
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
				label: z.literal("Body"),
				name: z.literal("body"),
				type: z.literal("textarea"),
				value: gitHubNodeValueSchemas.body,
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
				label: z.literal("State"),
				name: z.literal("state"),
				type: z.literal("dropdown"),
				value: gitHubNodeValueSchemas.state,
				default: z.literal("open").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Open", value: "open" },
						{ label: "Closed", value: "closed" },
						{ label: "All", value: "all" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["list_issues", "update_issue", "list_prs"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Labels"),
				name: z.literal("labels"),
				type: z.literal("input"),
				value: gitHubNodeValueSchemas.labels,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["list_issues", "create_issue", "update_issue"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Assignees"),
				name: z.literal("assignees"),
				type: z.literal("input"),
				value: gitHubNodeValueSchemas.assignees,
				required: z.boolean(),
				description: z.string().optional(),
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
				value: gitHubNodeValueSchemas.assignee,
				required: z.boolean(),
				description: z.string().optional(),
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
				label: z.literal("Pull Request Number"),
				name: z.literal("pull_number"),
				type: z.literal("input"),
				value: gitHubNodeValueSchemas.pull_number,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("get_pr")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Base Branch"),
				name: z.literal("base"),
				type: z.literal("input"),
				value: gitHubNodeValueSchemas.base,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_prs")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Per Page"),
				name: z.literal("per_page"),
				type: z.literal("number"),
				value: gitHubNodeValueSchemas.per_page,
				default: z.literal("30").optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["list_issues", "list_prs", "list_repos"]),
							),
						}),
					)
					.optional(),
			}),
		]),
	),
});
