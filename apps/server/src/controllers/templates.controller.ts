import { db, eq, templateDataTable, templatesTable } from "@nodebase/db";
import type { Template } from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";

export const getAllTemplates = async (_req: Request, res: Response) => {
	const templates = await db.select().from(templatesTable).limit(100);
	return res.json({ templates });
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
