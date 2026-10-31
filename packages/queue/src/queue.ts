import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type {
	NodeExecutionConfig,
	NodeJobPayload,
	WorkflowJobPayload,
} from "./types.js";
import { NODE_QUEUE_NAME, WORKFLOW_QUEUE_NAME } from "./types.js";

if (!process.env.REDIS_URL) {
	console.error("[queue] REDIS_URL is not set");
	process.exit(1);
}

export const connection = new Redis(process.env.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
	lazyConnect: false,
});

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

export async function addWorkflowInQueue(
	data: WorkflowJobPayload,
	jobId?: string,
) {
	return workflowQueue.add("execute-workflow", data, {
		jobId: jobId ?? crypto.randomUUID(),
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

export async function removeWorkflowJobs(workflowId: string) {
	const states = [
		"active",
		"waiting",
		"delayed",
		"prioritized",
		"waiting-children",
		"paused",
		"completed",
		"failed",
	] as const;
	const [workflowJobs, nodeJobs] = await Promise.all([
		workflowQueue.getJobs([...states]),
		nodeQueue.getJobs([...states]),
	]);
	const matching = [...nodeJobs, ...workflowJobs].filter(
		(job) => job.data.workflowId === workflowId,
	);
	for (const job of matching) {
		if (await job.isActive()) return { removed: false, executionIds: [] };
	}
	for (const job of matching) {
		// A worker may claim a waiting job between the state check and removal.
		try {
			await job.remove();
		} catch (error) {
			if (await job.isActive()) return { removed: false, executionIds: [] };
			throw error;
		}
	}
	return {
		removed: true,
		executionIds: [
			...new Set(matching.map((job) => job.data.executionId).filter(Boolean)),
		],
	};
}

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
