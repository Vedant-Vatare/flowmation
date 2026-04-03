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
		return {
			id: executionId,
			output: executionResponse.output,
			allowedNodePorts: allowedNodePorts,
			status: executionResponse.status ?? "completed",
		};
	},
	{ connection, concurrency: 10 },
);

workflowNodesWorker.on(
	"completed",
	async (job: Job<NodeJobPayload>, execution) => {
		console.log("node completed with result", execution);

		if (execution.status === "waiting") return;

		await completeNodeExecutionQuery(execution.id, execution.output);
		await storeNodeOutput(
			job.data.workflowId,
			job.data.node.name,
			execution.output,
		);
	},
);

workflowNodesWorker.on(
	"failed",
	async (job: Job<NodeJobPayload> | undefined, err: Error) => {
		if (!job) return;
		console.error(err);

		await completeNodeExecutionQuery(job.data.node.id, err.message);
		await storeNodeOutput(job.data.workflowId, job.data.node.name, {
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
