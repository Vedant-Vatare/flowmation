import {
	db,
	eq,
	inArray,
	nodesTable,
	sql,
	templateDataTable,
	templatesTable,
	userWorkflowsTable,
	workflowConnectionsTable,
	workflowNodesTable,
} from "@nodebase/db";
import type { Template } from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { isDBQueryError } from "@/utils/api.utils.js";
import { createUniqueWorkflowName } from "@/utils/workflow.utils.js";

export const getAllTemplates = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = 30;
	const skip = (page - 1) * limit;

	if (!Number.isInteger(page) || page < 1) {
		throw createHttpError.BadRequest("page must be a positive integer");
	}

	const templates = await db
		.select()
		.from(templatesTable)
		.limit(limit + 1)
		.offset(skip);

	const hasNextPage = templates.length > limit;

	return res.json({ templates: templates.slice(0, limit), hasNextPage });
};

export const getTemplate = async (req: Request, res: Response) => {
	const templateId = req.params.id as string;
	if (!templateId) {
		throw createHttpError.BadRequest("invalid template Id");
	}

	const [template] = await db
		.select()
		.from(templatesTable)
		.where(eq(templatesTable.id, templateId));

	if (!template) {
		throw createHttpError.NotFound("template not found");
	}

	return res.json({ template });
};

export const addTemplate = async (req: Request, res: Response) => {
	const template = req.body as Template;

	const [newTemplate] = await db
		.insert(templatesTable)
		.values({ ...template, useCount: 0 })
		.returning();

	return res
		.status(201)
		.json({ message: "new template added", template: newTemplate });
};

export const updateTemplate = async (req: Request, res: Response) => {
	const templateId = req.params.id as string;
	if (!templateId) {
		throw createHttpError.BadRequest("invalid template Id");
	}
	const templateData = req.body as Partial<Template>;

	const updates = Object.fromEntries(
		Object.entries(templateData).filter(([, v]) => v !== undefined),
	);

	if (Object.keys(updates).length === 0) {
		throw createHttpError.BadRequest("no fields to update");
	}

	const [updatedTemplate] = await db
		.update(templatesTable)
		.set(updates)
		.where(eq(templatesTable.id, templateId))
		.returning();

	if (!updatedTemplate) {
		throw createHttpError.NotFound("template was not found");
	}

	return res
		.status(200)
		.json({ message: "template was updated", template: updatedTemplate });
};

export const deleteTemplate = async (req: Request, res: Response) => {
	const templateId = req.params.id as string;
	if (!templateId) {
		throw createHttpError.BadRequest("invalid template Id");
	}

	const [deletedTemplate] = await db
		.delete(templatesTable)
		.where(eq(templatesTable.id, templateId))
		.returning();

	if (!deletedTemplate) {
		throw createHttpError.BadRequest("template was not found");
	}

	return res
		.status(200)
		.json({ message: "template was deleted", template: deletedTemplate });
};

export const addTemplateData = async (req: Request, res: Response) => {
	const { templateId, nodes, connections } = req.body;

	const [existing] = await db
		.select()
		.from(templateDataTable)
		.where(eq(templateDataTable.templateId, templateId));

	if (existing) {
		throw createHttpError.Conflict("template data already exists");
	}

	const [newData] = await db
		.insert(templateDataTable)
		.values({ templateId, nodes, connections })
		.returning();

	return res
		.status(201)
		.json({ message: "template data added", data: newData });
};

export const updateTemplateData = async (req: Request, res: Response) => {
	const { templateId, nodes, connections } = req.body;

	const [data] = await db
		.insert(templateDataTable)
		.values({ templateId, nodes, connections })
		.onConflictDoUpdate({
			target: templateDataTable.templateId,
			set: { nodes, connections },
		})
		.returning();

	return res.status(200).json({ message: "template data updated", data });
};

export const getTemplateData = async (req: Request, res: Response) => {
	const templateId = req.params.id as string;
	if (!templateId) {
		throw createHttpError.BadRequest("invalid template Id");
	}
	const [data] = await db
		.select()
		.from(templateDataTable)
		.where(eq(templateDataTable.templateId, templateId));

	if (!data) {
		throw createHttpError.NotFound("template data not found");
	}

	return res.status(200).json({ data });
};

export const useTemplate = async (req: Request, res: Response) => {
	const templateId = req.params.id as string;
	const userId = res.locals.userId as string;

	if (!templateId) {
		throw createHttpError.BadRequest("invalid template Id");
	}
	if (!userId) {
		throw createHttpError.Unauthorized("Authentication required");
	}

	const [template] = await db
		.select()
		.from(templatesTable)
		.where(eq(templatesTable.id, templateId));

	if (!template) {
		throw createHttpError.NotFound("template not found");
	}

	const [templateData] = await db
		.select()
		.from(templateDataTable)
		.where(eq(templateDataTable.templateId, templateId));

	if (!templateData) {
		throw createHttpError.NotFound("template data not found");
	}

	const tasks = [...new Set(templateData.nodes.map((n) => n.task))];

	let catalogNodes: (typeof nodesTable.$inferSelect)[] = [];
	if (tasks.length > 0) {
		catalogNodes = await db
			.select()
			.from(nodesTable)
			.where(inArray(nodesTable.task, tasks));
	}

	const nodeIdByTask = new Map(catalogNodes.map((n) => [n.task, n.id]));

	const missing = tasks.filter((t) => !nodeIdByTask.has(t));
	if (missing.length > 0) {
		throw createHttpError.BadRequest(`Unknown tasks: ${missing.join(", ")}`);
	}

	const createWorkflow = async (name: string) => {
		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(userWorkflowsTable)
				.values({
					userId,
					name,
					description: template.description ?? undefined,
				})
				.returning();

			if (!created)
				throw createHttpError.InternalServerError("Failed to create workflow");

			const idMap = new Map<string, string>();

			if (templateData.nodes.length > 0) {
				const rows = templateData.nodes.map((n) => {
					const newId = crypto.randomUUID();
					if (n.id) idMap.set(n.id, newId);
					return {
						id: newId,
						workflowId: created.id,
						nodeId: nodeIdByTask.get(n.task) as string,
						positionX: Math.round(n.positionX),
						positionY: Math.round(n.positionY),
						name: n.name,
						type: n.type,
						task: n.task,
						description: n.description ?? null,
						credentialId: null,
						settings: n.settings,
						parameters: n.parameters as never,
						outputPorts: n.outputPorts as never,
						inputPorts: n.inputPorts as never,
					};
				});
				await tx.insert(workflowNodesTable).values(rows);
			}

			if (templateData.connections.length > 0) {
				const rows = templateData.connections.map((c) => ({
					id: crypto.randomUUID(),
					workflowId: created.id,
					sourceId: idMap.get(c.sourceId) ?? c.sourceId,
					targetId: idMap.get(c.targetId) ?? c.targetId,
					sourcePort: c.sourcePort ?? "default",
					targetPort: c.targetPort ?? "default",
				}));
				await tx.insert(workflowConnectionsTable).values(rows);
			}

			await tx
				.update(templatesTable)
				.set({ useCount: sql`${templatesTable.useCount} + 1` })
				.where(eq(templatesTable.id, templateId));

			return created;
		});
	};

	const maxAttempts = 3;
	for (let attempt = 1; ; attempt++) {
		try {
			const workflow = await createWorkflow(
				createUniqueWorkflowName(template.title),
			);
			return res.status(201).json({ workflow });
		} catch (error) {
			const dbError = isDBQueryError(error);
			const constraint = (error as { cause?: { constraint?: string } })?.cause
				?.constraint;
			if (
				attempt >= maxAttempts ||
				dbError?.code !== "23505" ||
				constraint !== "user_workflows_user_id_name_unique"
			) {
				throw error;
			}
		}
	}
};
