import { and, db, eq, userWorkflowsTable } from "@nodebase/db";
import type {
	CreateWorkflow,
	ExecuteWorkflowRequest,
	UpdateUserWorkflow,
} from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { isDBQueryError } from "@/utils/api.utils.js";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

export const createWorkflow = async (req: Request, res: Response) => {
	try {
		const userId = res.locals.userId as string;
		const workflow = req.body as CreateWorkflow;
		const [userWorkflow] = await db
			.insert(userWorkflowsTable)
			.values({ ...workflow, userId })
			.returning();

		return res
			.status(201)
			.json({ message: "user workflow created", userWorkflow });
	} catch (e) {
		const queryError = isDBQueryError(e);

		if (queryError?.code === "23505") {
			throw createHttpError.Conflict("workflow with the name already exists");
		}
		throw e;
	}
};

export const updateUserWorkflow = async (req: Request, res: Response) => {
	try {
		const workflowId = req.params.id as string;
		const userId = res.locals.userId as string;
		const workflowData = req.body as UpdateUserWorkflow;

		if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

		const updatedWorkflow = await db
			.update(userWorkflowsTable)
			.set(workflowData)
			.where(
				and(
					eq(userWorkflowsTable.id, workflowId),
					eq(userWorkflowsTable.userId, userId),
				),
			)
			.returning();

		return res.status(200).json({
			message: "workflow updated",
			workflow: updatedWorkflow[0],
		});
	} catch (e) {
		const queryError = isDBQueryError(e);
		if (queryError?.code === "23503") {
			throw createHttpError.NotFound("workflow not found");
		}
	}
};

export const getUserWorkflow = async (req: Request, res: Response) => {
	const workflowId = req.params.id;

	if (!workflowId || Array.isArray(workflowId))
		throw createHttpError.BadRequest("invalid workflow id");

	const userWorkflows = await db
		.select()
		.from(userWorkflowsTable)
		.where(eq(userWorkflowsTable.id, workflowId));

	return res
		.status(200)
		.json({ message: "user workflows fetched", userWorkflows });
};

export const getAllUserWorkflow = async (_req: Request, res: Response) => {
	const userWorkflows = await db.select().from(userWorkflowsTable);

	return res
		.status(200)
		.json({ message: "all workflows fetched", userWorkflows });
};

export const executeWorkflow = async (req: Request, res: Response) => {
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
