import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const hubspotNodeValueSchemas = {
	operation: withExpr(z.string()),
	contactId: withExpr(z.string()),
	firstName: withExpr(z.string()),
	lastName: withExpr(z.string()),
	email: withExpr(z.string()),
	phone: withExpr(z.string()),
	company: withExpr(z.string()),
	jobTitle: withExpr(z.string()),
	dealId: withExpr(z.string()),
	dealName: withExpr(z.string()),
	dealStage: withExpr(z.string()),
	amount: withExpr(z.string()),
	pipeline: withExpr(z.string()),
} as const;

const dependsOnSchema = z.array(
	z.object({ parameter: z.string(), values: z.array(z.unknown()) }),
);

export const hubspotNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.hubspot"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("operation"),
				label: z.literal("Operation"),
				type: z.literal("dropdown"),
				value: hubspotNodeValueSchemas.operation,
				default: z.literal("create_contact"),
				required: z.boolean().default(true),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Contact", value: "create_contact" },
						{ label: "Update Contact", value: "update_contact" },
						{ label: "Get Contact", value: "get_contact" },
						{ label: "Create Deal", value: "create_deal" },
						{ label: "Update Deal", value: "update_deal" },
						{ label: "Get Deal", value: "get_deal" },
					]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("contactId"),
				label: z.literal("Contact ID"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.contactId,
				required: z.boolean().default(true),
				description: z.string().optional(),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["update_contact", "get_contact"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("firstName"),
				label: z.literal("First Name"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.firstName,
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_contact", "update_contact"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("lastName"),
				label: z.literal("Last Name"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.lastName,
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_contact", "update_contact"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("email"),
				label: z.literal("Email"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.email,
				required: z.boolean().default(true),
				description: z.string().optional(),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_contact", "update_contact", "get_contact"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("phone"),
				label: z.literal("Phone"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.phone,
				required: z.boolean().default(false),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_contact", "update_contact"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("company"),
				label: z.literal("Company"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.company,
				required: z.boolean().default(false),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_contact", "update_contact"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("jobTitle"),
				label: z.literal("Job Title"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.jobTitle,
				required: z.boolean().default(false),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_contact", "update_contact"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("dealId"),
				label: z.literal("Deal ID"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.dealId,
				required: z.boolean().default(true),
				description: z.string().optional(),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["update_deal", "get_deal"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("dealName"),
				label: z.literal("Deal Name"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.dealName,
				required: z.boolean().default(true),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_deal", "update_deal"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("dealStage"),
				label: z.literal("Deal Stage"),
				type: z.literal("dropdown"),
				value: hubspotNodeValueSchemas.dealStage,
				required: z.boolean().default(false),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Qualified to Buy", value: "qualifiedtobuy" },
						{ label: "Decision Maker", value: "decisionmaker" },
						{ label: "Contract Sent", value: "contractsent" },
						{ label: "Closed Won", value: "closedwon" },
						{ label: "Closed Lost", value: "closedlost" },
					]),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_deal", "update_deal"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("amount"),
				label: z.literal("Amount"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.amount,
				required: z.boolean().default(false),
				placeholder: z.string().optional(),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_deal", "update_deal"] },
				]),
			}),

			nodeParameterSchema.extend({
				name: z.literal("pipeline"),
				label: z.literal("Pipeline"),
				type: z.literal("input"),
				value: hubspotNodeValueSchemas.pipeline,
				required: z.boolean().default(false),
				placeholder: z.string().optional(),
				dependsOn: dependsOnSchema.default([
					{ parameter: "operation", values: ["create_deal", "update_deal"] },
				]),
			}),
		]),
	),
});
