import {
	connection,
	NODE_QUEUE_NAME,
	type NodeJobPayload,
} from "@nodebase/queue";
import { type Job, UnrecoverableError, Worker } from "bullmq";
import { executeNode } from "@/executer.js";
import {
	completeNodeExecutionQuery,
	createNodeExecutionQuery,
} from "@/queries/workflow.executions.js";

export const workflowNodesWorker = new Worker(
	NODE_QUEUE_NAME,
	async (job: Job<NodeJobPayload>) => {
		await createNodeExecutionQuery(job.data.workflowId, job.data.node.id);

		const executionResponse = await executeNode(job.data.node);

		if (!executionResponse?.success) {
			throw new UnrecoverableError(
				executionResponse?.message || "failed to execute node",
			);
		}
		return executionResponse.output;
	},
	{ connection },
);

workflowNodesWorker.on(
	"completed",
	async (job: Job<NodeJobPayload>, result) => {
		console.log("node completed with result", result);

		await completeNodeExecutionQuery(job.data.node.id, result);
	},
);

workflowNodesWorker.on(
	"failed",
	async (job: Job<NodeJobPayload> | undefined, err: Error) => {
		if (!job) return;
		console.error(err);
		await completeNodeExecutionQuery(job.data.node.id, err.message);
	},
);

workflowNodesWorker.on("error", (err) => {
	console.error(err);
});
