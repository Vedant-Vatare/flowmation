export const WORKFLOW_QUEUE_NAME = "workflows" as const;
export const NODE_QUEUE_NAME = "workflow-nodes" as const;

export interface WorkflowJobPayload {
	executionId: string;
	workflowId: string;
	userId: string;
}

export interface NodeJobPayload {
	executionId: string;
	workflowId: string;
	nodeInstanceId: string;
	input: Record<string, unknown>;
}
