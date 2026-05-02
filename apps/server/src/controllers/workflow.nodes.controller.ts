import {
	and,
	db,
	eq,
	inArray,
	type SQL,
	sql,
	userWorkflowsTable,
	workflowNodesTable,
} from "@nodebase/db";
import type {
	NodeIdsWithPosition,
	PartialWorkflowNode,
	WorkflowNode,
} from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { isDBQueryError } from "@/utils/api.utils.js";

export const addNodeInWorkflow = async (req: Request, res: Response) => {
	try {
		const userId = res.locals.userId as string;
		const node = req.body.node as WorkflowNode;
		const workflow = await db.query.userWorkflowsTable.findFirst({
			where: and(
				eq(userWorkflowsTable.id, node.workflowId),
				eq(userWorkflowsTable.userId, userId),
			),
		});

		if (!workflow) {
			throw createHttpError.Forbidden("workflow not found");
		}
		const [userWorkflowNode] = await db
			.insert(workflowNodesTable)
			.values({
				id: node.id,
				workflowId: node.workflowId,
				nodeId: node.nodeId,
				name: node.name,
				task: node.task,
				description: node.description,
				type: node.type,
				parameters: node.parameters,
				credentials: node.credentials ?? null,
				config: node.config,
				positionX: node.positionX ?? null,
				positionY: node.positionY ?? null,
				outputPorts: node.outputPorts ?? null,
				inputPorts: node.inputPorts ?? null,
			})
			.returning();

		return res
			.status(201)
			.json({ message: "node added to the workflow", userWorkflowNode });
	} catch (e) {
		const queryError = isDBQueryError(e);

		if (queryError?.code === "23505") {
			throw createHttpError.Conflict("given node instance already exists");
		}
		if (queryError?.code === "22P02") {
			throw createHttpError.Conflict("invalid node id found");
		}
		throw e;
	}
};

export const getNodesInWorkflow = async (req: Request, res: Response) => {
	const workflowId = req.params.workflowId as string;
	if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");
	const userId = res.locals.userId as string;

	const userWorkflow = await db.query.userWorkflowsTable.findFirst({
		where: and(
			eq(userWorkflowsTable.id, workflowId),
			eq(userWorkflowsTable.userId, userId),
		),
	});

	if (!userWorkflow) {
		throw createHttpError.Forbidden("workflow not found");
	}

	const workflow = await db
		.select()
		.from(workflowNodesTable)
		.where(eq(workflowNodesTable.workflowId, workflowId));
	return res
		.status(200)
		.json({ message: "workflow nodes fetched successfully", workflow });
};

export const updateNodeInWorkflow = async (req: Request, res: Response) => {
	const node = req.body.validatedNode as PartialWorkflowNode;
	const userId = res.locals.userId as string;
	const workflowId = req.params.workflowId as string;

	if (!node.id) {
		throw createHttpError.BadRequest("invalid node id");
	}

	if (!workflowId) {
		throw createHttpError.BadRequest("invalid workflow id");
	}

	const userWorkflow = await db.query.userWorkflowsTable.findFirst({
		where: and(
			eq(userWorkflowsTable.id, workflowId),
			eq(userWorkflowsTable.userId, userId),
		),
	});

	if (!userWorkflow) throw createHttpError.Forbidden("workflow not found");

	const [existingNode] = await db
		.select()
		.from(workflowNodesTable)
		.where(eq(workflowNodesTable.id, node.id));

	if (!existingNode) {
		throw createHttpError.NotFound("node does not exist");
	}

	const mergedData = { ...existingNode, ...node };

	const [updatedNode] = await db
		.update(workflowNodesTable)
		.set(mergedData)
		.where(eq(workflowNodesTable.id, node.id))
		.returning();

	return res.status(200).json({
		message: "node instance updated",
		updatedNode,
	});
};

export const updateNodesPositions = async (req: Request, res: Response) => {
	const nodes = req.body as NodeIdsWithPosition;
	const workflowId = req.params.workflowId as string;
	const userId = res.locals.userId;

	if (nodes.length === 0)
		throw createHttpError.BadRequest("No nodes provided for position update");

	if (!workflowId) throw createHttpError.BadRequest("Invalid workflow id");

	const userWorkflow = await db.query.userWorkflowsTable.findFirst({
		where: and(
			eq(userWorkflowsTable.id, workflowId),
			eq(userWorkflowsTable.userId, userId),
		),
	});

	if (!userWorkflow) throw createHttpError.Forbidden("workflow not found");

	const ids: string[] = [];
	const positionXChunks: SQL[] = [];
	const positionYChunks: SQL[] = [];

	positionXChunks.push(sql`(case`);
	positionYChunks.push(sql`(case`);

	for (const node of nodes) {
		positionXChunks.push(
			sql`when ${workflowNodesTable.id} = ${node.id} then ${node.positionX}::integer`,
		);
		positionYChunks.push(
			sql`when ${workflowNodesTable.id} = ${node.id} then ${node.positionY}::integer`,
		);
		ids.push(node.id);
	}

	positionXChunks.push(sql`end)`);
	positionYChunks.push(sql`end)`);

	const finalPositionX: SQL = sql.join(positionXChunks, sql.raw(" "));
	const finalPositionY: SQL = sql.join(positionYChunks, sql.raw(" "));

	const updatedNodes = await db
		.update(workflowNodesTable)
		.set({
			positionX: finalPositionX,
			positionY: finalPositionY,
		})
		.where(
			and(
				inArray(workflowNodesTable.id, ids),
				eq(workflowNodesTable.workflowId, workflowId),
			),
		)
		.returning({
			id: workflowNodesTable.id,
			positionX: workflowNodesTable.positionX,
			positionY: workflowNodesTable.positionY,
		});

	if (updatedNodes.length === 0)
		throw createHttpError.NotFound("No nodes were found to update");

	return res.status(200).json({
		message: "Node positions updated successfully",
		nodes: updatedNodes,
	});
};

export const deleteNodeInWorkflow = async (req: Request, res: Response) => {
	if (!req.body || !req.body.workflowId || !req.body.id) {
		throw createHttpError.BadRequest("invalid node data");
	}
	const { workflowId, id } = req.body as {
		id: string;
		workflowId: string;
	};

	const query = await db
		.delete(workflowNodesTable)
		.where(
			and(
				eq(workflowNodesTable.id, id),
				eq(workflowNodesTable.workflowId, workflowId),
			),
		);
	if (query.rowCount === 0) {
		throw createHttpError.NotFound("node was not found");
	}
	return res.status(200).json({ message: "node instance deleted" });
};
