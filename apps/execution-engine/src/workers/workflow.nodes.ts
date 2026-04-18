import {
	connection,
	NODE_QUEUE_NAME,
	type NodeJobPayload,
	type WorkflowNodesWorker,
} from "@nodebase/queue";
import { type Job, UnrecoverableError, Worker } from "bullmq";
import { executeNode } from "@/executer.js";
import { storeNodeOutput } from "@/services/executionStore.js";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handlePreviousNodeExecution } from "@/utils/node.executor.utils.js";
import {
	recordNodeCompletion,
	recordNodeStart,
} from "@/utils/workflow.updates.utils.js";

export const workflowNodesWorker = new Worker(
	NODE_QUEUE_NAME,
	async (job: Job<NodeJobPayload>): Promise<WorkflowNodesWorker> => {
		console.log("picked up node:", job.data.node.name);

		await handlePreviousNodeExecution(job.data);

		const nodeExecutionId = crypto.randomUUID();
		await job.updateData({ ...job.data, nodeExecutionId });

		await recordNodeStart(job.data);

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
			await recordNodeCompletion(job.data, executionResponse.output);
		} else {
			/* store the node completion in the cache store only so other nodes can view its execution */
			storeNodeOutput(
				job.data.executionId,
				job.data.node.name,
				executionResponse.output,
			);
		}

		return {
			id: nodeExecutionId,
			output: executionResponse.output,
			allowedNodePorts: allowedNodePorts,
			status: executionResponse.status ?? "completed",
		};
	},
	{ connection, concurrency: 10 },
);

workflowNodesWorker.on(
	"failed",
	async (job: Job<NodeJobPayload> | undefined, err: Error) => {
		if (!job?.data.nodeExecutionId) return;
		console.error(err);
		await recordNodeCompletion(job.data, err.message);
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
