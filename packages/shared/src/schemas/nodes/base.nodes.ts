import { z } from "zod";

export const nodeTypesSchema = z.enum([
	"action",
	"trigger",
	"transform",
	"cron",
	"helper",
	"webhook",
]);

export const nodeCredentialsEnum = z.enum([
	"OAuth",
	"API Keys",
	"Bearer_Token",
	"username_password",
]);

export const nodeCredentialSchema = z.object({
	name: z.string(),
	value: z.string(),
	required: z.boolean(),
	type: nodeCredentialsEnum,
});

export const nodePropertyTypeSchema = z.enum([
	"input",
	"number",
	"dropdown",
	"checkbox",
	"radio",
	"textarea",
	"boolean",
	"key",
	"key-value",
	"array",
	"date",
]);

export const parameterDependSchema = z.object({
	parameter: z.string(),
	values: z.array(z.unknown()),
});

export const nodeParameterSchema = z.object({
	label: z.string(),
	name: z.string(),
	description: z.string().optional(),
	placeholder: z.string().optional(),
	type: nodePropertyTypeSchema,
	value: z.unknown(),
	default: z.string().optional(),
	required: z.boolean().optional(),
	multiValued: z.boolean().optional(),
	dependsOn: z.array(parameterDependSchema).optional(),
});

export const nodeOutputPortsSchema = z.object({
	name: z.string(),
	label: z.string(),
});

export const nodeInputPortsSchema = z.object({
	name: z.string(),
	label: z.string(),
});

export const baseNodeSettingsSchema = z.object({
	retryAfterFail: z.boolean(),
	executeOnlyOnce: z.boolean(),
});

export const baseNodeSchema = z.object({
	name: z.string(),
	task: z.string(),
	description: z.string(),
	icon: z.string().optional(),
	type: nodeTypesSchema,
	parameters: z.array(nodeParameterSchema),
	outputPorts: z.array(nodeOutputPortsSchema).default([
		{
			name: "default",
			label: "default",
		},
	]),
	inputPorts: z.array(nodeInputPortsSchema).default([
		{
			name: "default",
			label: "default",
		},
	]),
	credentials: nodeCredentialSchema.optional(),
	settings: baseNodeSettingsSchema.optional(),
});

export const updateBaseNodeSchema = baseNodeSchema.partial();
