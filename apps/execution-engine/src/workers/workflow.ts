import {
	connection,
	WORKFLOW_QUEUE_NAME,
	type WorkflowJobPayload,
} from "@nodebase/queue";
import { type Job, Worker } from "bullmq";
import {
	updateUserWorkflowStatusQuery,
	updateWorkflowStatusQuery,
} from "@/queries/workflow.executions.js";

export const worker = new Worker(
	WORKFLOW_QUEUE_NAME,
	async (job: Job<WorkflowJobPayload>) => {
		console.log("id:", job.id);
		console.log(job.data.executionId);
	},
	{ connection },
);

worker.on("completed", async (job: Job<WorkflowJobPayload>) => {
	console.log("completed exec. for id:", job.data.executionId);
	await updateWorkflowStatusQuery(job.data.executionId, "executed");
	await updateUserWorkflowStatusQuery(job.data.workflowId, "active");
});

worker.on(
	"failed",
	async (job: Job<WorkflowJobPayload> | undefined, err: Error) => {
		if (!job) return;
		console.error(err);
		await updateWorkflowStatusQuery(job.data.executionId, "failed");
	},
);

worker.on("error", (err) => {
	console.error(err);
});
