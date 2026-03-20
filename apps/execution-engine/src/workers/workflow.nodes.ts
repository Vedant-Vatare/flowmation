import {
	connection,
	NODE_QUEUE_NAME,
	type NodeJobPayload,
} from "@nodebase/queue";
import { type Job, Worker } from "bullmq";
import { updateWorkflowStatusQuery } from "@/queries/workflow.executions.js";

export const workflowNodesWorker = new Worker(
	NODE_QUEUE_NAME,
	async (job: Job<NodeJobPayload>) => {
		console.log("id:", job.id);
		console.log(job.data.executionId);
	},
	{ connection },
);

workflowNodesWorker.on("completed", async (job: Job<NodeJobPayload>) => {
	console.log("completed node execution:", job.data.executionId);
});

workflowNodesWorker.on(
	"failed",
	async (job: Job<NodeJobPayload> | undefined, err: Error) => {
		if (!job) return;
		console.error(err);
		await updateWorkflowStatusQuery(job.data.executionId, "failed");
	},
);

workflowNodesWorker.on("error", (err) => {
	console.error(err);
});
