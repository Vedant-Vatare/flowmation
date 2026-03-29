import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";

import type { JobsOptions } from "bullmq";

export const WORKFLOW_QUEUE_NAME = "workflows" as const;
export const NODE_QUEUE_NAME = "workflow-nodes" as const;

export type WorkflowJobPayload = {
	executionId: string;
	workflowId: string;
	nodes: WorkflowNode[];
	connections: WorkflowConnection[];
};

export type NodeExecutionConfig = Partial<JobsOptions>;

export interface NodeJobPayload {
	executionId: string;
	workflowId: string;
	node: WorkflowNode;
	nodeConfig?: NodeExecutionConfig;
}
