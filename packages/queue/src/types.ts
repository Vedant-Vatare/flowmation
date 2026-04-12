import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";

import type { JobsOptions } from "bullmq";

export const WORKFLOW_QUEUE_NAME = "workflows" as const;
export const NODE_QUEUE_NAME = "workflow-nodes" as const;

export type WorkflowTriggerType = "trigger" | "webhook" | "schedule";

export type WorkflowJobPayload = {
	executionId: string;
	workflowId: string;
	userId: string;
	triggerNodeId: string;
	triggerType: WorkflowTriggerType;
	nodes: WorkflowNode[];
	connections: WorkflowConnection[];
};

export type WorkflowNodesWorker = {
	id: string;
	output?: unknown;
	allowedNodePorts: string[];
	status: string;
};

export type NodeExecutionConfig = Partial<JobsOptions>;

export type NodeJobPayload = {
	executionId: string;
	workflowId: string;
	node: WorkflowNode;
	nodeConfig?: NodeExecutionConfig;
	nodeData?: { inputNodeNames: string[] };
};

export type PrevioudExecution = {
	id: string;
	nodeName: string;
	status: string;
	output?: unknown;
} | null;
