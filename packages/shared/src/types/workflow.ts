import type { z } from "zod";
import type {
	NodeIdsWithPositionSchema,
	partialWorkflowConnectionSchema,
	partialWorkflowNodeSchema,
	userWorkflowSchema,
	workflowConnectionSchema,
	workflowNodeSchema,
} from "@/schemas/workflow.js";

export type WorkflowStatus =
	| "active"
	| "stopped"
	| "running"
	| "executed"
	| "failed";

export type CreateWorkflow = {
	name: string;
	description: string;
	status: "active";
	executionCount: 0;
};

export type UserWorkflow = z.infer<typeof userWorkflowSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type PartialWorkflowNode = z.infer<typeof partialWorkflowNodeSchema>;
export type WorkflowConnection = z.infer<typeof workflowConnectionSchema>;
export type partialWorkflowConnection = z.infer<
	typeof partialWorkflowConnectionSchema
>;
export type NodeIdsWithPosition = z.infer<typeof NodeIdsWithPositionSchema>;
