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
export type UpdateUserWorkflow = Partial<CreateWorkflow>;

export type ExecuteWorkflowRequest = {
	triggerNodeId: string;
	liveUpdates?: boolean;
	triggerType: "trigger" | "webhook" | "schedule";
};

export type NodeExecutionUpdate =
	| {
			type: "node:started";
			nodeId: string;
			startedAt: Date;
	  }
	| {
			type: "node:completed";
			nodeId: string;
			output: unknown;
			completedAt: Date;
	  }
	| {
			type: "node:failed";
			nodeId: string;
			error: string;
	  };

export type WorkflowExecutionUpdate =
	| {
			type: "workflow:completed";
			completedAt: Date;
	  }
	| {
			type: "workflow:failed";
			error: string;
	  };

export type ExecutionEventType = "workflow-update" | "node-update";

export type ExecutionUpdate = WorkflowExecutionUpdate | NodeExecutionUpdate;

export type UserWorkflow = z.infer<typeof userWorkflowSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type PartialWorkflowNode = z.infer<typeof partialWorkflowNodeSchema>;
export type WorkflowConnection = z.infer<typeof workflowConnectionSchema>;
export type partialWorkflowConnection = z.infer<
	typeof partialWorkflowConnectionSchema
>;
export type NodeIdsWithPosition = z.infer<typeof NodeIdsWithPositionSchema>;
