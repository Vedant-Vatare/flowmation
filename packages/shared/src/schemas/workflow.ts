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
	.extend({ id: z.uuid(), workflowId: z.uuid() });

export const NodeIdsWithPositionSchema = z.array(
	z.object({
		id: z.uuid(),
		positionX: z.number(),
		positionY: z.number(),
	}),
);

export const templateSchema = z.object({
	title: z.string(),
	description: z.string(),
	isActive: z.boolean().default(false),
	category: z.string(),
	nodeCount: z.number().default(0),
	triggerType: z
		.enum(["webhook", "schedule", "manual", "input_trigger"])
		.nullish(),
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
	isActive: z.boolean().optional(),
	category: z.string().optional(),
	nodeCount: z.number().optional(),
	triggerType: z
		.enum(["webhook", "schedule", "manual", "input_trigger"])
		.optional(),
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

export const workflowFileSchema = z
	.object({
		format: z.literal("flowmation"),
		version: z.literal(1),
		name: z.string().trim().min(1).max(255),
		description: z.string().max(10000).default(""),
		nodes: z
			.array(
				templateNodeSchema.extend({
					id: z.uuid(),
					name: z.string().min(1).max(255),
					positionX: z.number().int().min(-2147483648).max(2147483647),
					positionY: z.number().int().min(-2147483648).max(2147483647),
				}),
			)
			.max(1000),
		connections: z.array(templateConnectionSchema).max(5000),
	})
	.superRefine((file, ctx) => {
		const ids = new Set(file.nodes.map((node) => node.id));
		const names = new Set(file.nodes.map((node) => node.name));
		if (ids.size !== file.nodes.length || names.size !== file.nodes.length) {
			ctx.addIssue({
				code: "custom",
				message: "Node IDs and names must be unique",
			});
		}
		const connections = new Set<string>();
		for (const connection of file.connections) {
			if (!ids.has(connection.sourceId) || !ids.has(connection.targetId)) {
				ctx.addIssue({
					code: "custom",
					message: "Connections must reference nodes in this workflow",
				});
			}
			const key = JSON.stringify([
				connection.sourceId,
				connection.sourcePort,
				connection.targetId,
				connection.targetPort,
			]);
			if (connections.has(key))
				ctx.addIssue({ code: "custom", message: "Duplicate connection" });
			connections.add(key);
		}
	});

export type WorkflowFile = z.infer<typeof workflowFileSchema>;

export const templateDataSchema = z.object({
	templateId: z.uuid(),
	nodes: z.array(templateNodeSchema),
	connections: z.array(templateConnectionSchema),
});
