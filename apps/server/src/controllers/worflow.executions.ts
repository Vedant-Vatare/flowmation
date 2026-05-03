import {
	and,
	db,
	desc,
	eq,
	userWorkflowsTable,
	workflowExecutionTable,
} from "@nodebase/db";
import type { ExecuteWorkflowRequest } from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { isDBQueryError } from "@/utils/api.utils.js";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

export const executeWorkflow = async (req: Request, res: Response) => {
	console.log("in handler abc");

	const workflowId = req.params.id as string;
	const { triggerNodeId, triggerType, liveUpdates } =
		req.body as ExecuteWorkflowRequest;
	if (!triggerNodeId || !triggerType) {
		throw createHttpError.BadRequest(
			" invalid workflow configs. missing trigger node id or trigger type",
		);
	}

	const [userWorkflowExecution] = await db
		.update(userWorkflowsTable)
		.set({ status: "running" })
		.where(
			and(
				eq(userWorkflowsTable.id, workflowId),
				eq(userWorkflowsTable.userId, res.locals.userId),
			),
		)
		.returning();

	if (!userWorkflowExecution) {
		throw createHttpError.InternalServerError(
			"could not initate workflow execution",
		);
	}
	const executionId = await enqueueWorkflow(
		workflowId,
		res.locals.userId,
		triggerNodeId,
		triggerType,
		liveUpdates,
	);

	return res.status(201).json({
		message: "workflow execution started successfully",
		userWorkflowExecution,
		executionId,
	});
};

export const getWorkflowLogs = async (req: Request, res: Response) => {
	try {
		const workflowId = req.params.workflowId as string;
		const page = Number(req.query.page) || 1;
		const limit = 15;
		const skip = page * limit;
		const userId = res.locals.userId;
		if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

		if (!Number.isInteger(page))
			throw createHttpError.BadRequest("page must be integer");

		const workflowLogs = await db
			.select()
			.from(workflowExecutionTable)
			.where(
				and(
					eq(workflowExecutionTable.userId, userId),
					eq(workflowExecutionTable.workflowId, workflowId),
				),
			)
			.orderBy(desc(workflowExecutionTable.executedAt))
			.limit(limit + 1)
			.offset(skip);

		const hasNextPage = workflowLogs.length > limit;

		return res.status(200).json({
			message: "workflow logs fetched successfully",
			logs: workflowLogs,
			hasNextPage,
		});
	} catch (e) {
		const dbError = isDBQueryError(e);
		console.log(e);

		if (dbError?.code === "22P02")
			throw createHttpError.NotFound("workflow not found");
	}
};
