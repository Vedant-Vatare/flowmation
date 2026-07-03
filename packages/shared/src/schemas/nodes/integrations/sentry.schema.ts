import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const sentryNodeValueSchemas = {
	operation: withExpr(z.string()),
	orgSlug: withExpr(z.string()),
	issueId: withExpr(z.string()),
	status: withExpr(z.string()),
	version: withExpr(z.string()),
	projects: withExpr(z.string()),
	limit: withExpr(z.string()),
} as const;

export const sentryNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.sentry"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: sentryNodeValueSchemas.operation,
				default: z.literal("list_issues").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "List Issues", value: "list_issues" },
						{ label: "Get Issue", value: "get_issue" },
						{ label: "Update Issue", value: "update_issue" },
						{ label: "List Projects", value: "list_projects" },
						{ label: "List Releases", value: "list_releases" },
						{ label: "Create Release", value: "create_release" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Organization Slug"),
				name: z.literal("orgSlug"),
				type: z.literal("input"),
				value: sentryNodeValueSchemas.orgSlug,
				required: z.boolean(),
				description: z.string().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Issue ID"),
				name: z.literal("issueId"),
				type: z.literal("input"),
				value: sentryNodeValueSchemas.issueId,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("get_issue"),
									z.literal("update_issue"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Status"),
				name: z.literal("status"),
				type: z.literal("dropdown"),
				value: sentryNodeValueSchemas.status,
				default: z.literal("resolved").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Resolved", value: "resolved" },
						{ label: "Unresolved", value: "unresolved" },
						{ label: "Ignored", value: "ignored" },
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
				label: z.literal("Release Version"),
				name: z.literal("version"),
				type: z.literal("input"),
				value: sentryNodeValueSchemas.version,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_release")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Projects"),
				name: z.literal("projects"),
				type: z.literal("input"),
				value: sentryNodeValueSchemas.projects,
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_release")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("input"),
				value: sentryNodeValueSchemas.limit,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("list_issues"),
									z.literal("list_projects"),
									z.literal("list_releases"),
								]),
							),
						}),
					)
					.optional(),
			}),
		]),
	),
});
