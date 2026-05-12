import { db, eq, userWorkflowsTable, workflowNodesTable } from "@nodebase/db";
import createHttpError from "http-errors";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

type WebhookExecution = {
	webhookId: string;
	webhookData: unknown;
	liveUpdates?: boolean;
};
export const webhookExecution = async ({
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

	if (!result?.userId || !result?.workflowId)
		throw createHttpError.NotFound("invalid webhook URL");

	const executionId = await enqueueWorkflow({
		workflowId: result.workflowId,
		userId: result.userId,
		triggerNodeId: webhookId,
		triggerType: "webhook",
		triggerData: webhookData ?? null,
		liveUpdates,
	});
	return { success: true, executionId };
};
