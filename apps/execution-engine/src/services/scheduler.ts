import { db, eq, workflowSnapshotsTable } from "@nodebase/db";
import type { WorkflowJobPayload } from "@nodebase/queue";
import { connection, WORKFLOW_QUEUE_NAME } from "@nodebase/queue";
import { Queue } from "bullmq";

const workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, { connection });

export const scheduleWorkflow = async (
	workflowId: string,
	payload: WorkflowJobPayload,
	repeat: { every?: number; pattern?: string; limit?: number },
) => {
	const [workflowSnapshot] = await db
		.select()
		.from(workflowSnapshotsTable)
		.where(eq(workflowSnapshotsTable.workflowId, workflowId));

	await workflowQueue.upsertJobScheduler(`scheduler:${workflowId}`, repeat, {
		name: `scheduled:${workflowId}`,
		data: {
			...payload,
			nodes: workflowSnapshot?.nodes ?? payload.nodes,
			connections: workflowSnapshot?.connections ?? payload.connections,
			triggerType: "schedule",
		},
	});
};
