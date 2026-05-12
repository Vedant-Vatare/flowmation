import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { webhookExecution } from "@/services/webhook.js";

export const webhook = async (req: Request, res: Response) => {
	const webhookId = req.params.webhookId as string;

	if (!webhookId) throw createHttpError.BadRequest("webhookId was invalid");

	await webhookExecution({ webhookId, webhookData: req.body });
	return res.status(201).json({
		message: "workflow execution started successfully",
	});
};
