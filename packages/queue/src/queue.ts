import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";
import { Queue } from "bullmq";
import "dotenv/config";
import type {
	NodeExecutionConfig,
	NodeJobPayload,
	WorkflowJobPayload,
} from "./types.js";
import { NODE_QUEUE_NAME, WORKFLOW_QUEUE_NAME } from "./types.js";

export const connection = {
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
	maxRetriesPerRequest: null,
};

const defaultJobOptions = {
	removeOnComplete: {
		age: 3 * 24 * 60 * 60,
		count: 1000,
	},
	removeOnFail: {
		age: 7 * 24 * 60 * 60,
		count: 500,
	},
};

const workflowQueue = new Queue<WorkflowJobPayload>(WORKFLOW_QUEUE_NAME, {
	connection,
	defaultJobOptions,
});

const nodeQueue = new Queue<NodeJobPayload>(NODE_QUEUE_NAME, {
	connection,
	defaultJobOptions,
});

export async function addWorkflowInQueue(data: WorkflowJobPayload) {
	return workflowQueue.add("execute-workflow", data, {
		jobId: crypto.randomUUID(),
	});
}

export async function addNodeInQueue(
	data: NodeJobPayload,
	nodeConfigs: NodeExecutionConfig = {},
) {
	return nodeQueue.add("execute-node", data, nodeConfigs);
}

export const removeScheduledWorkflow = async (workflowId: string) => {
	await workflowQueue.removeJobScheduler(`scheduler:${workflowId}`);
};

export const scheduleWorkflow = async (
	workflowId: string,
	userId: string,
	nodes: WorkflowNode[],
	connections: WorkflowConnection[],
	repeat: { every?: number; pattern?: string; limit?: number },
) => {
	const triggerNodeId = nodes.find((n) => n.task === "trigger.cron")?.id;
	await workflowQueue.upsertJobScheduler(`scheduler:${workflowId}`, repeat, {
		name: `scheduled:${workflowId}`,
		data: {
			workflowId,
			userId,
			nodes,
			connections,
			triggerNodeId,
			triggerType: "schedule",
		} as WorkflowJobPayload,
	});
};
