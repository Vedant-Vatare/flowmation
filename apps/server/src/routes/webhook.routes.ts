import { db, eq, userWorkflowsTable, workflowNodesTable } from "@nodebase/db";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

export const webhook = async (req: Request, res: Response) => {
	const webhookId = req.params.webhookId as string;

	if (!webhookId) throw createHttpError.BadRequest("webhookId was invalid");

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
		return createHttpError.NotFound("invalid webhook URL");

	await enqueueWorkflow({
		workflowId: result.workflowId,
		userId: result.userId,
		triggerNodeId: webhookId,
		triggerType: "webhook",
		triggerData: req.body ?? null,
	});

	return res.status(201).json({
		message: "workflow execution started successfully",
	});
};
