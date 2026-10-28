import {
	and,
	db,
	eq,
	exists,
	inArray,
	type SQL,
	sql,
	userWorkflowsTable,
	validateNodeCredential,
	workflowNodesTable,
} from "@nodebase/db";
import type {
	NodeIdsWithPosition,
	PartialWorkflowNode,
	WorkflowNode,
} from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { isDBQueryError } from "@/utils/api.utils.js";
import { validateNodeSchema } from "@/utils/nodes.utils.js";

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
			throw createHttpError.NotFound("workflow not found");
		}
		await validateCredential(node, userId);
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
				credentialId: node.credentialId ?? null,
				settings: node.settings,
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
		throw createHttpError.NotFound("workflow not found");
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

	if (!node.id || !z.uuid().safeParse(node.id).success) {
		throw createHttpError.BadRequest("invalid node id");
	}

	if (!z.uuid().safeParse(workflowId).success) {
		throw createHttpError.BadRequest("invalid workflow id");
	}

	const userWorkflow = await db.query.userWorkflowsTable.findFirst({
		where: and(
			eq(userWorkflowsTable.id, workflowId),
			eq(userWorkflowsTable.userId, userId),
		),
	});

	if (!userWorkflow) throw createHttpError.NotFound("workflow not found");

	const [existingNode] = await db
		.select()
		.from(workflowNodesTable)
		.where(
			and(
				eq(workflowNodesTable.id, node.id),
				eq(workflowNodesTable.workflowId, workflowId),
			),
		);

	if (!existingNode) {
		throw createHttpError.NotFound("node does not exist");
	}

	for (const key of ["workflowId", "nodeId", "task", "type"] as const) {
		if (node[key] !== undefined && node[key] !== existingNode[key]) {
			throw createHttpError.BadRequest("node identity cannot be changed");
		}
	}

	const updates = {
		name: node.name,
		description: node.description,
		parameters: node.parameters,
		settings: node.settings,
		credentialId: node.credentialId,
		positionX: node.positionX,
		positionY: node.positionY,
	};
	const effectiveNode = {
		...existingNode,
		...Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined),
		),
	};
	const validation = validateNodeSchema(effectiveNode);

	if (!validation.success)
		throw createHttpError.BadRequest("invalid node configuration");

	await validateCredential(effectiveNode, userId);

	const [updatedNode] = await db
		.update(workflowNodesTable)
		.set(updates)
		.where(
			and(
				eq(workflowNodesTable.id, node.id),
				eq(workflowNodesTable.workflowId, workflowId),
			),
		)
		.returning();

	return res.status(200).json({
		message: "node instance updated",
		updatedNode,
	});
};

export const updateNodesPositions = async (req: Request, res: Response) => {
	const nodes = req.body.nodes as NodeIdsWithPosition;
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

	if (!userWorkflow) throw createHttpError.NotFound("workflow not found");

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

	if (
		!z.uuid().safeParse(id).success ||
		!z.uuid().safeParse(workflowId).success
	) {
		throw createHttpError.BadRequest("invalid node data");
	}
	const userId = res.locals.userId as string;
	const query = await db.delete(workflowNodesTable).where(
		and(
			eq(workflowNodesTable.id, id),
			exists(
				db
					.select({ id: userWorkflowsTable.id })
					.from(userWorkflowsTable)
					.where(
						and(
							eq(userWorkflowsTable.id, workflowId),
							eq(userWorkflowsTable.userId, userId),
						),
					),
			),
			eq(workflowNodesTable.workflowId, workflowId),
		),
	);
	if (query.rowCount === 0) {
		throw createHttpError.NotFound("node was not found");
	}
	return res.status(200).json({ message: "node instance deleted" });
};

const validateCredential = async (node: WorkflowNode, userId: string) => {
	try {
		await validateNodeCredential(node, userId);
	} catch {
		throw createHttpError.BadRequest("invalid node or credential selection");
	}
};
