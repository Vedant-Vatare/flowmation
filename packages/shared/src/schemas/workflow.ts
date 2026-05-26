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
});

export const updateWorkflowSchema = createWorkflowSchema
	.partial()
	.extend({ executionCount: z.number() });

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
