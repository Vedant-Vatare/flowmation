import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { storeTestWebhook } from "@/services/redis.js";
import { webhookExecution } from "@/services/webhook.js";

export const registerTestWebhook = async (req: Request, res: Response) => {
	const webhookId = req.params.webhookId as string;
	const executionId = crypto.randomUUID();
	await storeTestWebhook(webhookId, executionId);
	return res
		.status(201)
		.json({ message: "test webhook was registered", executionId });
};

export const webhook = async (req: Request, res: Response) => {
	const webhookId = req.params.webhookId as string;

	if (!webhookId) throw createHttpError.BadRequest("webhookId was invalid");

	await webhookExecution({ webhookId, webhookData: req.body });
	return res.status(201).json({
		message: "workflow execution started successfully",
	});
};
