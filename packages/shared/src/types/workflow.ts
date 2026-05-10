import type { z } from "zod";
import type {
	NodeIdsWithPositionSchema,
	partialWorkflowConnectionSchema,
	partialWorkflowNodeSchema,
	userWorkflowSchema,
	workflowConnectionSchema,
	workflowNodeSchema,
} from "@/schemas/workflow.js";

export const WORKFLOW_STATUSES = ["active", "inactive"] as const;

export const EXECUTION_STATUSES = [
	"running",
	"success",
	"failed",
	"cancelled",
] as const;

export const NODE_EXECUTION_STATUSES = [
	"running",
	"success",
	"failed",
	"skipped",
] as const;

export const TRIGGER_TYPES = ["manual", "webhook", "schedule"] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type NodeExecutionStatus = (typeof NODE_EXECUTION_STATUSES)[number];
export type TriggerType = (typeof TRIGGER_TYPES)[number];

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
			workflowNodeId: string;
			task: string;
			startedAt: Date;
	  }
	| {
			type: "node:completed";
			workflowNodeId: string;
			task: string;
			output: unknown;
			completedAt: Date;
	  }
	| {
			type: "node:failed";
			workflowNodeId: string;
			task: string;
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

export type WorkflowExecution = {
	id: string;
	workflowId: string;
	userId: string;
	status: (typeof EXECUTION_STATUSES)[number];
	executedAt: Date;
	completedAt: Date | null;
	result: string | null;
};

export type ExecutionLog = {
	id: string;
	workflowId: string;
	workflowName: string | null;
	status: "running" | "success" | "failed" | "cancelled";
	executedAt: Date;
	completedAt: Date | null;
};
