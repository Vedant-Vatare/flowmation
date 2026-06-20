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
	const workflowId = req.params.id as string;
	const { triggerNodeId, triggerType, liveUpdates } =
		req.body as ExecuteWorkflowRequest;
	if (!triggerNodeId || !triggerType) {
		throw createHttpError.BadRequest(
			" invalid workflow configs. missing trigger node id or trigger type",
		);
	}

	const [userWorkflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.id, workflowId),
				eq(userWorkflowsTable.userId, res.locals.userId),
			),
		);

	if (!userWorkflow) {
		throw createHttpError.NotFound("workflow was not found");
	}
	const executionId = await enqueueWorkflow({
		workflowId,
		userId: res.locals.userId,
		triggerNodeId,
		triggerType,
		triggerData: req.body ?? [],
		liveUpdates,
	});

	return res.status(201).json({
		message: "workflow execution started successfully",
		userWorkflow,
		executionId,
	});
};

export const getWorkflowLogs = async (req: Request, res: Response) => {
	try {
		const workflowId = req.params.workflowId as string;
		const page = Number(req.query.page) || 1;
		const limit = 15;
		const skip = (page - 1) * limit;
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
			logs: workflowLogs.slice(0, limit),
			hasNextPage,
		});
	} catch (e) {
		const dbError = isDBQueryError(e);
		console.log(e);

		if (dbError?.code === "22P02")
			throw createHttpError.NotFound("workflow not found");
		throw e;
	}
};

export const getExecutionLogs = async (req: Request, res: Response) => {
	const userId = res.locals.userId;
	const page = Number(req.query.page) || 1;
	const limit = 15;
	const skip = (page - 1) * limit;

	const logs = await db
		.select({
			id: workflowExecutionTable.id,
			workflowId: workflowExecutionTable.workflowId,
			workflowName: userWorkflowsTable.name,
			status: workflowExecutionTable.status,
			executedAt: workflowExecutionTable.executedAt,
			completedAt: workflowExecutionTable.completedAt,
		})
		.from(workflowExecutionTable)
		.leftJoin(
			userWorkflowsTable,
			eq(workflowExecutionTable.workflowId, userWorkflowsTable.id),
		)
		.where(eq(workflowExecutionTable.userId, userId))
		.orderBy(desc(workflowExecutionTable.executedAt))
		.limit(limit + 1)
		.offset(skip);

	const hasNextPage = logs.length > limit;

	return res.status(200).json({
		logs: logs.slice(0, limit),
		hasNextPage,
	});
};
