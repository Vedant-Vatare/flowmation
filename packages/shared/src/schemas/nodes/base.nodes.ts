import { z } from "zod";

export const nodeTypesSchema = z.enum(["action", "trigger"]);

export const nodeCredentialsEnum = z.enum([
	"OAuth",
	"API Keys",
	"Bearer_Token",
	"username_password",
]);

export const anyNodeValueSchema: z.ZodType<unknown> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.array(anyNodeValueSchema),
		z.record(z.string(), anyNodeValueSchema),
	]),
);

export const nodeCredentialSchema = z.object({
	name: z.string(),
	value: z.string(),
	required: z.boolean(),
	type: nodeCredentialsEnum,
});

export const NodeSettingsSchema = z.object({
	hasExpressions: z.boolean().default(false),
	retryCount: z.number().int().min(0).max(3).default(0),
	timeout: z.number().int().min(0).default(30000),
	continueOnFail: z.boolean().default(false),
	alwaysOutputData: z.boolean().default(false),
	fallbackOutputData: z.unknown().optional(),
	disabled: z.boolean().default(false),
});

export const nodePropertyTypeSchema = z.enum([
	"input",
	"number",
	"dropdown",
	"checkbox",
	"radio",
	"textarea",
	"boolean",
	"key-value",
	"array",
	"date",
	"date-time",
]);

export const parameterDependSchema = z.object({
	parameter: z.string(),
	values: z.array(z.unknown()),
});
export const nodeParameterOptionsSchema = z.object({
	label: z.string(),
	value: anyNodeValueSchema,
	groupLabel: z.string().toLowerCase().optional(),
});

export const nodeParameterSchema = z.object({
	label: z.string(),
	name: z.string(),
	description: z.string().optional(),
	placeholder: z.string().optional(),
	type: nodePropertyTypeSchema,
	value: anyNodeValueSchema,
	options: z.array(nodeParameterOptionsSchema).optional(),
	default: anyNodeValueSchema.optional(),
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
	id: z.uuid().default(() => crypto.randomUUID()),
	name: z.string(),
	task: z.string(),
	description: z.string().nullable(),
	type: nodeTypesSchema,
	parameters: z.array(nodeParameterSchema),
	settings: NodeSettingsSchema,
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
	credentialProvider: z.string().optional(),
});

export const updateBaseNodeSchema = baseNodeSchema.partial();
