import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { getTestWebhook, storeTestWebhook } from "@/services/redis.js";
import { webhookExecution } from "@/services/webhook.js";

export const registerTestWebhook = async (req: Request, res: Response) => {
	const webhookId = req.params.webhookId as string;
	if (!webhookId) throw createHttpError.BadRequest("webhookId was invalid");

	const executionId = crypto.randomUUID();

	await storeTestWebhook(webhookId, executionId);
	return res
		.status(201)
		.json({ message: "test webhook was registered", executionId });
};

export const testWebhook = async (req: Request, res: Response) => {
	const webhookId = req.params.webhookId as string;
	if (!webhookId) throw createHttpError.BadRequest("webhookId was invalid");

	const executionId = await getTestWebhook(webhookId);
	if (!executionId) throw createHttpError.NotFound("invalid webhookId");
	await webhookExecution({
		executionId,
		webhookId,
		webhookData: req.body,
		liveUpdates: true,
	});

	return res.status(200).json({ message: "test webhook registered" });
};

export const webhook = async (req: Request, res: Response) => {
	const webhookId = req.params.webhookId as string;

	if (!webhookId) throw createHttpError.BadRequest("webhookId was invalid");

	await webhookExecution({
		webhookId,
		webhookData: req.body,
		executionId: crypto.randomUUID(),
	});
	return res.status(201).json({
		message: "workflow execution started successfully",
	});
};
