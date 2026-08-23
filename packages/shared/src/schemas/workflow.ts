import { z } from "zod";
import { baseNodeSchema } from "./nodes/index.js";

const workflowStatusEnum = z.enum([
	"active",
	"waiting",
	"cancelled",
	"executed",
	"failed",
	"running",
	"stopped",
]);

export const userWorkflowSchema = z.object({
	id: z.uuid().default(() => crypto.randomUUID()),
	name: z.string(),
	description: z.string().optional(),
	status: workflowStatusEnum.default("active"),
	executionCount: z.number().default(0),
	lastExecutedAt: z.iso.datetime().optional(),
	createdAt: z.iso.datetime().default(() => new Date().toISOString()),
	updatedAt: z.iso.datetime().default(() => new Date().toISOString()),
});

export const createWorkflowSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	status: workflowStatusEnum.default("active"),
	executionCount: z.number().default(0),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const workflowTriggerTypeEnum = z.enum([
	"trigger",
	"webhook",
	"schedule",
]);

export const executeWorkflowSchema = z.object({
	triggerNodeId: z.uuid(),
	liveUpdates: z.boolean().optional(),
	triggerType: workflowTriggerTypeEnum,
});

export const workflowNodeSchema = baseNodeSchema
	.omit({ credentialProvider: true })
	.extend({
		id: z.uuid().default(() => crypto.randomUUID()),
		workflowId: z.uuid(),
		nodeId: z.uuid(),
		positionX: z.number(),
		positionY: z.number(),
		credentialId: z.uuid().nullable(),
	});

export const partialWorkflowNodeSchema = workflowNodeSchema.partial();

export const workflowConnectionSchema = z.object({
	id: z.uuid().default(() => crypto.randomUUID()),
	workflowId: z.uuid(),
	sourceId: z.uuid(),
	targetId: z.uuid(),
	sourcePort: z.string().default("default"),
	targetPort: z.string().default("default"),
});

export const partialWorkflowConnectionSchema = workflowConnectionSchema
	.partial()
	.extend({ id: z.string() });

export const NodeIdsWithPositionSchema = z.array(
	z.object({
		id: z.uuid(),
		positionX: z.number(),
		positionY: z.number(),
	}),
);

const THUMBNAIL_MAX_LENGTH = 2_000_000;

export const templateSchema = z.object({
	title: z.string(),
	description: z.string(),
	thumbnail: z.string().max(THUMBNAIL_MAX_LENGTH).nullish(),
	isActive: z.boolean().default(false),
	category: z.string(),
	nodeCount: z.number().default(0),
	triggerType: z.enum(["webhook", "schedule", "manual", "input_trigger"]).nullish(),
	integrationsUsed: z.array(z.string()).default([]),
	difficulty: z.string().nullish(),
	useCount: z.number(),
	tags: z.array(z.string()),
	createdBy: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const newTemplateSchema = templateSchema.omit({
	createdAt: true,
	updatedAt: true,
	useCount: true,
});

export const updateTemplateSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	thumbnail: z.string().max(THUMBNAIL_MAX_LENGTH).optional(),
	isActive: z.boolean().optional(),
	category: z.string().optional(),
	nodeCount: z.number().optional(),
	triggerType: z.enum(["webhook", "schedule", "manual", "input_trigger"]).optional(),
	integrationsUsed: z.array(z.string()).optional(),
	difficulty: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

export const templateNodeSchema = workflowNodeSchema.omit({
	workflowId: true,
	credentialId: true,
	nodeId: true,
});

export const templateConnectionSchema = z.object({
	id: z.uuid().default(() => crypto.randomUUID()),
	sourceId: z.uuid(),
	targetId: z.uuid(),
	sourcePort: z.string().default("default"),
	targetPort: z.string().default("default"),
});

export const templateDataSchema = z.object({
	templateId: z.uuid(),
	nodes: z.array(templateNodeSchema),
	connections: z.array(templateConnectionSchema),
});
