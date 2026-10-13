import {
	credentialsTable,
	db,
	eq,
	userWorkflowsTable,
	workflowSnapshotsTable,
} from "@nodebase/db";
import { credentialRegistry } from "@nodebase/shared";
import { decrypt } from "@nodebase/shared/utils";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import {
	acceptTriggerEvent,
	claimTriggerEvent,
	releaseTriggerEvent,
} from "@/triggers/deduplication.js";
import {
	httpTriggerHandlers,
	type TriggerResponse,
} from "@/triggers/registry.js";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

const callbackParamsSchema = z.object({
	workflowId: z.uuid(),
	triggerNodeId: z.uuid(),
});

const sendResponse = (res: Response, response: TriggerResponse) => {
	if (response.afterResponse) {
		const afterResponse = response.afterResponse;
		res.once("finish", () => {
			void afterResponse().catch(() => {
				console.error("HTTP trigger response cleanup failed");
			});
		});
	}
	if (response.headers) res.set(response.headers);
	res.status(response.status);
	return response.body === undefined ? res.end() : res.json(response.body);
};

export const triggerCallback = async (req: Request, res: Response) => {
	const params = callbackParamsSchema.safeParse(req.params);
	if (!params.success) throw createHttpError.BadRequest("Invalid trigger URL");
	const { workflowId, triggerNodeId } = params.data;

	const workflow = await db.query.userWorkflowsTable.findFirst({
		where: eq(userWorkflowsTable.id, workflowId),
	});

	if (!workflow || workflow.status !== "active") {
		throw createHttpError.NotFound("Active workflow not found");
	}

	const snapshot = await db.query.workflowSnapshotsTable.findFirst({
		where: eq(workflowSnapshotsTable.workflowId, workflowId),
	});

	const node = snapshot?.nodes.find(
		(candidate) => candidate.id === triggerNodeId,
	);

	if (
		!snapshot ||
		!node ||
		node.type !== "trigger" ||
		!node.task.startsWith("trigger.") ||
		node.settings?.disabled
	) {
		throw createHttpError.NotFound("Published HTTP trigger not found");
	}

	const integration = httpTriggerHandlers.get(node.task);
	if (!integration)
		throw createHttpError.NotImplemented("Unsupported HTTP trigger");

	const { triggerHandler, credentialProvider } = integration;

	let credential: Record<string, string> | null = null;

	if (credentialProvider) {
		const credentialDefinition = credentialRegistry[credentialProvider];

		if (!credentialDefinition)
			throw createHttpError.InternalServerError(
				"Unknown trigger credential provider",
			);

		if (credentialDefinition.type !== "apiKey") {
			throw createHttpError.NotImplemented(
				"This trigger credential type is not supported yet",
			);
		}

		if (!node.credentialId)
			throw createHttpError.BadRequest("Trigger credential is missing");

		const savedCredential = await db.query.credentialsTable.findFirst({
			where: eq(credentialsTable.id, node.credentialId),
		});
		if (
			!savedCredential ||
			savedCredential.userId !== workflow.userId ||
			savedCredential.provider !== credentialProvider ||
			savedCredential.type !== "apiKey"
		) {
			throw createHttpError.BadRequest("Invalid trigger credential");
		}
		credential = {};
		for (const field of credentialDefinition.fields) {
			const value = savedCredential.fields?.[field.key];
			if (field.secret && !value)
				throw createHttpError.BadRequest("Trigger credential is incomplete");
			if (value) credential[field.key] = field.secret ? decrypt(value) : value;
		}
	}

	const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
	let body: unknown;
	if (rawBody.length && req.is("application/json")) {
		try {
			body = JSON.parse(rawBody.toString("utf8"));
		} catch {
			throw createHttpError.BadRequest("Invalid JSON body");
		}
	}
	const request = {
		method: req.method,
		headers: req.headers,
		query: req.query,
		rawBody,
		body,
	};
	const context = {
		workflowId,
		triggerNodeId,
		node,
		credential,
	};
	const verification = await triggerHandler.verifyRequest(request, context);

	if (!verification.valid) return sendResponse(res, verification.response);

	const setupResponse = await triggerHandler.handleSetup?.(request, context);

	if (setupResponse) return sendResponse(res, setupResponse);

	const event = await triggerHandler.handleEvent(request, context);

	if (event.kind === "trigger") {
		const claim = event.eventId
			? await claimTriggerEvent(workflowId, triggerNodeId, event.eventId)
			: undefined;
		if (claim === null) return sendResponse(res, event.response);
		try {
			await enqueueWorkflow(
				{
					workflowId,
					userId: workflow.userId,
					triggerNodeId,
					triggerType: "webhook",
					triggerData: event.data,
				},
				snapshot,
			);
		} catch (error) {
			if (claim) await releaseTriggerEvent(claim);
			throw error;
		}
		if (claim) await acceptTriggerEvent(claim);
	}
	return sendResponse(res, event.response);
};
