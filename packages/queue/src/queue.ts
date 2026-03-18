import { Queue } from "bullmq";
import "dotenv/config";
import type { NodeJobPayload, WorkflowJobPayload } from "./types.js";
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
	return workflowQueue.add("execute-workflow", data);
}

export async function addNodeInQueue(data: NodeJobPayload) {
	return nodeQueue.add("execute-node", data, {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
	});
}
