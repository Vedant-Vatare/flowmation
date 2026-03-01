import { db, eq, nodesTable } from "@nodebase/db";
import type { BaseNode } from "@nodebase/shared";
import type { Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";

export const createNode: RequestHandler = async (
	req: Request,
	res: Response,
) => {
	const nodeData = req.body as BaseNode;

	const [node] = await db
		.insert(nodesTable)
		.values({
			name: nodeData.name,
			task: nodeData.task,
			type: nodeData.type,
			description: nodeData.description,
			parameters: nodeData.parameters,
			credentials: nodeData.credentials,
			inputPorts: nodeData.inputPorts,
			outputPorts: nodeData.outputPorts,
		})
		.returning();
	return res.status(201).json({ message: "node created successfully", node });
};

export const getAllNodes: RequestHandler = async (
	_req: Request,
	res: Response,
) => {
	const nodes = await db.select().from(nodesTable);
	return res.status(200).json({ message: "fetched all nodes", nodes });
};

type partialsBaseNode = Partial<BaseNode>;

export const updateNode: RequestHandler = async (
	req: Request,
	res: Response,
) => {
	const nodeId = req.params.id as string;
	const data = req.body as partialsBaseNode;

	const updatedNode = await db
		.update(nodesTable)
		.set(data)
		.where(eq(nodesTable.id, nodeId))
		.returning();

	return res
		.status(200)
		.json({ message: "node updated successfully", updatedNode });
};

export const deleteNode: RequestHandler = async (
	req: Request,
	res: Response,
) => {
	const nodeId = req.params.id as string;

	if (!nodeId) throw createHttpError.BadRequest("Invalid node id");

	const query = await db.delete(nodesTable).where(eq(nodesTable.id, nodeId));

	if (query.rowCount === 0) {
		throw createHttpError.NotFound("Node not found");
	}

	return res.status(200).json({ message: "node deleted successfully" });
};
