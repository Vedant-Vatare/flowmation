import { db, eq, userWorkflowsTable, workflowNodesTable } from "@nodebase/db";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

export const webhook = async (req: Request, res: Response) => {
	console.log("in webhook controller");

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

	const executionId = await enqueueWorkflow(
		result.workflowId,
		result.userId,
		webhookId,
		"webhook",
		undefined,
	);

	console.log({ executionId });

	return res.status(201).json({
		message: "workflow execution started successfully",
	});
};
