import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";

export const WORKFLOW_QUEUE_NAME = "workflows" as const;
export const NODE_QUEUE_NAME = "workflow-nodes" as const;

export type WorkflowJobPayload = {
	executionId: string;
	workflowId: string;
	nodes: WorkflowNode[];
	connections: WorkflowConnection[];
};

export interface NodeJobPayload {
	executionId: string;
	workflowId: string;
	nodeInstanceId: string;
	input: Record<string, unknown>;
}
