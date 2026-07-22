import { db, eq, templatesTable } from "@nodebase/db";
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
	const templateId = req.query.id as string;
	if (!templateId) {
		throw createHttpError.BadRequest("invalid template Id");
	}
	const templateData = req.body as Partial<Template>;

	const [updatedTemplate] = await db
		.update(templatesTable)
		.set(templateData)
		.where(eq(templatesTable.id, templateId))
		.returning();

	if (!updatedTemplate) {
		throw createHttpError.BadRequest("template was not found");
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
