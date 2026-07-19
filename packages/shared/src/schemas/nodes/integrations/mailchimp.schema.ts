import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const mailchimpNodeValueSchemas = {
	resource: withExpr(z.string()),
	memberOperation: withExpr(z.string()),
	campaignOperation: withExpr(z.string()),
	listOperation: withExpr(z.string()),
	listId: withExpr(z.string()),
	email: withExpr(z.string()),
	status: withExpr(z.string()),
	mergeFields: withExpr(z.string()),
	tags: withExpr(z.string()),
	campaignId: withExpr(z.string()),
	campaignName: withExpr(z.string()),
	subject: withExpr(z.string()),
	fromName: withExpr(z.string()),
	replyTo: withExpr(z.string()),
	limit: withExpr(z.string()),
	campaignListId: withExpr(z.string()),
} as const;

const showForResource = (resources: string[]) =>
	z
		.array(z.object({ parameter: z.string(), values: z.array(z.unknown()) }))
		.default([{ parameter: "resource", values: resources }]);

export const mailchimpNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.mailchimp"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Resource"),
				name: z.literal("resource"),
				type: z.literal("dropdown"),
				value: mailchimpNodeValueSchemas.resource,
				default: z.literal("member").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Member", value: "member" },
						{ label: "Campaign", value: "campaign" },
						{ label: "List", value: "list" },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Member Operation"),
				name: z.literal("memberOperation"),
				type: z.literal("dropdown"),
				value: mailchimpNodeValueSchemas.memberOperation,
				default: z.literal("get").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create", value: "create" },
						{ label: "Get", value: "get" },
						{ label: "Get Many", value: "getAll" },
						{ label: "Update", value: "update" },
						{ label: "Archive", value: "archive" },
					]),
				dependsOn: showForResource(["member"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Campaign Operation"),
				name: z.literal("campaignOperation"),
				type: z.literal("dropdown"),
				value: mailchimpNodeValueSchemas.campaignOperation,
				default: z.literal("get").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create", value: "create" },
						{ label: "Get", value: "get" },
						{ label: "Get Many", value: "getAll" },
						{ label: "Send", value: "send" },
						{ label: "Delete", value: "delete" },
					]),
				dependsOn: showForResource(["campaign"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("List Operation"),
				name: z.literal("listOperation"),
				type: z.literal("dropdown"),
				value: mailchimpNodeValueSchemas.listOperation,
				default: z.literal("getAll").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Get Many", value: "getAll" },
						{ label: "Get", value: "get" },
					]),
				dependsOn: showForResource(["list"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("List ID"),
				name: z.literal("listId"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.listId,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: showForResource(["member", "list"]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Email"),
				name: z.literal("email"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.email,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([{ parameter: "resource", values: ["member"] }]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Status"),
				name: z.literal("status"),
				type: z.literal("dropdown"),
				value: mailchimpNodeValueSchemas.status,
				default: z.literal("subscribed").optional(),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Subscribed", value: "subscribed" },
						{ label: "Unsubscribed", value: "unsubscribed" },
						{ label: "Cleaned", value: "cleaned" },
						{ label: "Pending", value: "pending" },
						{ label: "Transactional", value: "transactional" },
					]),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["member"] },
						{ parameter: "memberOperation", values: ["create", "update"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Merge Fields (JSON)"),
				name: z.literal("mergeFields"),
				type: z.literal("textarea"),
				value: mailchimpNodeValueSchemas.mergeFields,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["member"] },
						{ parameter: "memberOperation", values: ["create", "update"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Tags (comma-separated)"),
				name: z.literal("tags"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.tags,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["member"] },
						{ parameter: "memberOperation", values: ["create", "update"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Campaign ID"),
				name: z.literal("campaignId"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.campaignId,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["campaign"] },
						{
							parameter: "campaignOperation",
							values: ["get", "send", "delete"],
						},
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Campaign Audience List ID"),
				name: z.literal("campaignListId"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.campaignListId,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["campaign"] },
						{ parameter: "campaignOperation", values: ["create"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Campaign Name"),
				name: z.literal("campaignName"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.campaignName,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["campaign"] },
						{ parameter: "campaignOperation", values: ["create"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Subject"),
				name: z.literal("subject"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.subject,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["campaign"] },
						{ parameter: "campaignOperation", values: ["create"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("From Name"),
				name: z.literal("fromName"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.fromName,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["campaign"] },
						{ parameter: "campaignOperation", values: ["create"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Reply-To Email"),
				name: z.literal("replyTo"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.replyTo,
				required: z.boolean().default(true),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
					)
					.default([
						{ parameter: "resource", values: ["campaign"] },
						{ parameter: "campaignOperation", values: ["create"] },
					]),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("input"),
				value: mailchimpNodeValueSchemas.limit,
				required: z.boolean().default(false),
				description: z.string().optional(),
				placeholder: z.string().optional(),
			}),
		]),
	),
});
