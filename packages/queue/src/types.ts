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
	triggerData?: unknown;
	nodes: WorkflowNode[];
	connections: WorkflowConnection[];
	liveUpdates?: boolean;
};

export type WorkflowNodesWorker = {
	id: string;
	output?: unknown;
	allowedNodePorts: string[];
	status: string;
};

export type NodeExecutionConfig = Partial<JobsOptions>;

export type PreviousExecution = {
	id: string;
	node: WorkflowNode;
	status: string;
	output?: unknown;
} | null;

export type LoopState = {
	_index: number;
	_items: unknown[];
	done: boolean;
};

export type NodeJobPayload = {
	executionId: string;
	workflowId: string;
	node: WorkflowNode;
	nodeExecutionId?: string;
	liveUpdates?: boolean;
	previousNodeExecution?: PreviousExecution;
	nodeData?: {
		inputNodeNames?: string[];
		loopState?: LoopState;
	};
};
