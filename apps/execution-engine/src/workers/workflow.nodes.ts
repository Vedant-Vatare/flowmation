import {
	connection,
	NODE_QUEUE_NAME,
	type NodeJobPayload,
	type WorkflowNodesWorker,
} from "@nodebase/queue";
import { type Job, UnrecoverableError, Worker } from "bullmq";
import { executeNode } from "@/executer.js";
import {
	completeNodeExecutionQuery,
	createNodeExecutionQuery,
} from "@/queries/workflow.executions.js";
import { storeNodeOutput } from "@/services/executionStore.js";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { broadcastExecutionUpdate } from "@/utils/sse.utils.js";

export const workflowNodesWorker = new Worker(
	NODE_QUEUE_NAME,
	async (job: Job<NodeJobPayload>): Promise<WorkflowNodesWorker> => {
		const executionId = await createNodeExecutionQuery(
			job.data.workflowId,
			job.data.node.id,
		);

		console.log("picked up node:", job.data.node.name);
		const executionResponse = await executeNode(job.data);
		const allowedNodePorts = getNodeOutputPorts(executionResponse);

		if (!executionResponse?.success) {
			throw new UnrecoverableError(
				executionResponse?.message || "failed to execute node",
			);
		}

		console.log(
			`${job.data.node.name} completed with result", ${JSON.stringify(executionResponse)}`,
		);

		if (executionResponse?.status !== "waiting") {
			await completeNodeExecutionQuery(executionId, executionResponse.output);
			await storeNodeOutput(
				job.data.executionId,
				job.data.node.name,
				executionResponse.output,
			);
		}

		return {
			id: executionId,
			output: executionResponse.output,
			allowedNodePorts: allowedNodePorts,
			status: executionResponse.status ?? "completed",
		};
	},
	{ connection, concurrency: 10 },
);

workflowNodesWorker.on("active", async (job: Job<NodeJobPayload>) => {
	broadcastExecutionUpdate(job.data, {
		type: "node:started",
		nodeId: job.data.node.id,
		startedAt: new Date(),
	});
});
workflowNodesWorker.on(
	"completed",
	async (job: Job<NodeJobPayload>, result: { output: unknown }) => {
		broadcastExecutionUpdate(job.data, {
			type: "node:completed",
			nodeId: job.data.node.id,
			completedAt: new Date(),
			output: result.output,
		});
	},
);

workflowNodesWorker.on(
	"failed",
	async (job: Job<NodeJobPayload> | undefined, err: Error) => {
		if (!job) return;
		console.error(err);
		await completeNodeExecutionQuery(job.data.node.id, err.message);
		await storeNodeOutput(job.data.executionId, job.data.node.name, {
			error: err.message,
		});
		broadcastExecutionUpdate(job.data, {
			type: "node:failed",
			nodeId: job.data.node.id,
			error: err.message,
		});
	},
);

workflowNodesWorker.on("error", (err) => {
	console.error(err);
});

export const getNodeOutputPorts = (
	executionResult: NodeExecutorOutput,
): string[] => {
	const outputPorts = executionResult?.allowedOutputPorts;
	return outputPorts?.length ? outputPorts : ["default"];
};
