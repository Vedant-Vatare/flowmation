import {
	and,
	db,
	eq,
	userWorkflowsTable,
	workflowConnectionsTable,
} from "@nodebase/db";
import type {
	partialWorkflowConnection,
	WorkflowConnection,
} from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";

export const addWorkflowConnection = async (req: Request, res: Response) => {
	const workflowConnection = req.body as WorkflowConnection;
	const userId = res.locals.userId;

	if (!workflowConnection.workflowId)
		throw createHttpError.BadRequest("invalid workflow id");

	const [userWorkflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.userId, userId),
				eq(userWorkflowsTable.id, workflowConnection.workflowId),
			),
		);

	if (!userWorkflow) throw createHttpError.NotFound("workflow not found");

	const [newWorkflowConnection] = await db
		.insert(workflowConnectionsTable)
		.values(workflowConnection)
		.returning();

	return res.status(201).json({
		message: "node connections created",
		workflowConnection: newWorkflowConnection,
	});
};

export const getAllConnectionsInWorkflow = async (
	req: Request,
	res: Response,
) => {
	const workflowId = req.params.workflowId as string;

	if (!workflowId) {
		throw createHttpError.BadRequest("invalid workflow id");
	}
	const userId = res.locals.userId;

	const [userWorkflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.userId, userId),
				eq(userWorkflowsTable.id, workflowId),
			),
		);

	if (!userWorkflow) throw createHttpError.NotFound("workflow not found");

	const workflowConnections = await db
		.select()
		.from(workflowConnectionsTable)
		.where(eq(workflowConnectionsTable.workflowId, workflowId));

	return res.status(200).json({
		message: "workflow connections fetched successfully",
		workflowConnections,
	});
};

export const updateNodeConnection = async (req: Request, res: Response) => {
	const workflowConnection = req.body as partialWorkflowConnection;
	const userId = res.locals.userId;

	if (!workflowConnection.workflowId)
		throw createHttpError.BadRequest("invalid workflow id");

	const [userWorkflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.userId, userId),
				eq(userWorkflowsTable.id, workflowConnection.workflowId),
			),
		);

	if (!userWorkflow) throw createHttpError.NotFound("workflow not found");

	const [updatedConnection] = await db
		.update(workflowConnectionsTable)
		.set(workflowConnection)
		.where(
			and(
				eq(workflowConnectionsTable.id, workflowConnection.id),
				eq(workflowConnectionsTable.workflowId, workflowConnection.workflowId),
			),
		)
		.returning();

	if (!updatedConnection)
		throw createHttpError.NotFound("node connection not found");

	return res.status(200).json({
		message: "node connection updated",
		updatedNodeConnection: updatedConnection,
	});
};

export const removeNodeConnection = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const workflowId = req.query.workflowId as string;
	const userId = res.locals.userId;

	if (!id) throw createHttpError.BadRequest("invalid connection id");
	if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

	const [userWorflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.userId, userId),
				eq(userWorkflowsTable.id, workflowId),
			),
		);
	if (!userWorflow) throw createHttpError.NotFound("wokflow was not found");

	const query = await db
		.delete(workflowConnectionsTable)
		.where(
			and(
				eq(workflowConnectionsTable.id, id),
				eq(workflowConnectionsTable.workflowId, workflowId),
			),
		);

	if (query.rowCount === 0) {
		throw createHttpError.NotFound("node connection was not found");
	}

	return res.status(200).json({ message: "node connection deleted" });
};
