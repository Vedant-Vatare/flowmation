import type { WorkflowJobPayload } from "@nodebase/queue";
import { connection, WORKFLOW_QUEUE_NAME } from "@nodebase/queue";
import { Queue } from "bullmq";

const workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, { connection });

export const scheduleWorkflow = async (
	workflowId: string,
	payload: WorkflowJobPayload,
	repeat: { every?: number; pattern?: string; limit?: number },
) => {
	await workflowQueue.upsertJobScheduler(`scheduler:${workflowId}`, repeat, {
		name: `scheduled:${workflowId}`,
		data: {
			...payload,
			triggerType: "schedule",
		},
	});
};

export const removeScheduledWorkflow = async (workflowId: string) => {
	await workflowQueue.removeJobScheduler(`scheduler:${workflowId}`);
};
