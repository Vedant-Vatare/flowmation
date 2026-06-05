import { db, eq, userWorkflowsTable, workflowNodesTable } from "@nodebase/db";
import createHttpError from "http-errors";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

type WebhookExecution = {
	executionId: string;
	webhookId: string;
	webhookData: unknown;
	liveUpdates?: boolean;
};
export const webhookExecution = async ({
	executionId,
	webhookId,
	webhookData,
	liveUpdates,
}: WebhookExecution) => {
	const [result] = await db
		.select({
			userId: userWorkflowsTable.userId,
			workflowId: userWorkflowsTable.id,
		})
		.from(workflowNodesTable)
		.where(eq(workflowNodesTable.id, webhookId))
		.leftJoin(
			userWorkflowsTable,
			eq(userWorkflowsTable.id, workflowNodesTable.workflowId),
		);
	console.log({ result, webhookId, executionId });

	if (!result?.userId || !result?.workflowId)
		throw createHttpError.NotFound("invalid webhook URL");

	const workflowExecutionid = await enqueueWorkflow({
		executionId,
		workflowId: result.workflowId,
		userId: result.userId,
		triggerNodeId: webhookId,
		triggerType: "webhook",
		triggerData: webhookData ?? null,
		liveUpdates,
	});
	return { success: true, executionId: workflowExecutionid };
};
