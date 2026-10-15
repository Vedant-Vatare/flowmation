import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "./base.nodes.js";

const staticFilter = z
	.string()
	.trim()
	.max(200)
	.refine((value) => !value.includes("{{") && !value.includes("}}"), {
		error: "Trigger filters cannot contain expressions",
	});

export const githubTriggerNodeValueSchemas = {
	repository: staticFilter.pipe(
		z.string().regex(/^[a-z\d_.-]+\/[a-z\d_.-]+$/i, "Use owner/repository"),
	),
	event: z
		.enum([
			"*",
			"push",
			"pull_request",
			"issues",
			"issue_comment",
			"release",
			"workflow_run",
			"create",
			"delete",
			"star",
			"fork",
		])
		.default("push"),
	actions: z
		.array(staticFilter.pipe(z.string().regex(/^[a-z_]+$/)))
		.default([]),
	branch: staticFilter.default(""),
} as const;

export const githubTriggerNodeSchema = baseNodeSchema.extend({
	task: z.literal("trigger.github"),
	type: z.literal("trigger"),
	credentialProvider: z.literal("github_webhook").default("github_webhook"),
	inputPorts: z.tuple([]).default([]),
	outputPorts: z
		.tuple([
			z.object({ name: z.literal("default"), label: z.literal("Default") }),
		])
		.default([{ name: "default", label: "Default" }]),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("repository"),
				label: z.literal("Repository"),
				type: z.literal("input"),
				value: githubTriggerNodeValueSchemas.repository,
				required: z.literal(true).default(true),
				placeholder: z.string().default("owner/repository"),
			}),
			nodeParameterSchema.extend({
				name: z.literal("event"),
				label: z.literal("Event"),
				type: z.literal("dropdown"),
				value: githubTriggerNodeValueSchemas.event,
				required: z.literal(true).default(true),
				default: z.literal("push").default("push"),
				options: nodeParameterSchema.shape.options.default([
					{ label: "Any repository event", value: "*" },
					{ label: "Push", value: "push" },
					{ label: "Pull request", value: "pull_request" },
					{ label: "Issue", value: "issues" },
					{ label: "Issue / PR comment", value: "issue_comment" },
					{ label: "Release", value: "release" },
					{ label: "Workflow run", value: "workflow_run" },
					{ label: "Branch / tag created", value: "create" },
					{ label: "Branch / tag deleted", value: "delete" },
					{ label: "Star", value: "star" },
					{ label: "Fork", value: "fork" },
				]),
			}),
			nodeParameterSchema.extend({
				name: z.literal("actions"),
				label: z.literal("Actions (optional)"),
				type: z.literal("array"),
				value: githubTriggerNodeValueSchemas.actions,
				required: z.literal(false).default(false),
				description: z
					.string()
					.default(
						"Exact actions such as opened, closed, or published. Empty accepts all actions; events without an action are ignored when this filter is set.",
					),
			}),
			nodeParameterSchema.extend({
				name: z.literal("branch"),
				label: z.literal("Push branch (optional)"),
				type: z.literal("input"),
				value: githubTriggerNodeValueSchemas.branch,
				required: z.literal(false).default(false),
				description: z
					.string()
					.default(
						"Exact branch name, for example main. Filters push events only; tag pushes do not match. Empty accepts all refs.",
					),
			}),
		]),
	),
});
