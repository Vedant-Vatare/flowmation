import { getGmailConfig } from "@nodebase/integrations";
import { addIntegrationEvent } from "@nodebase/queue";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";
import { z } from "zod";

const client = new OAuth2Client();
const envelopeSchema = z.object({
	subscription: z.string(),
	message: z.object({
		messageId: z.string().min(1).max(255),
		data: z.string().min(1).max(4096),
	}),
});
const notificationSchema = z.object({
	emailAddress: z.email().transform((email) => {
		return email.toLowerCase();
	}),
	historyId: z.union([
		z.string().regex(/^\d+$/).max(128),
		z.number().nonnegative().refine(Number.isSafeInteger).transform(String),
	]),
});

export const verifyGmailPushToken = async (
	authorization: string | undefined,
) => {
	const config = getGmailConfig();
	const token = /^Bearer ([^\s]+)$/i.exec(authorization || "")?.[1];
	if (!token) {
		throw createHttpError.Unauthorized("Missing Pub/Sub authentication");
	}
	try {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: config.audience,
		});
		const payload = ticket.getPayload();
		if (
			!payload ||
			payload.email !== config.serviceAccount ||
			payload.email_verified !== true
		) {
			throw new Error("Unexpected push identity");
		}
	} catch {
		throw createHttpError.Unauthorized("Invalid Pub/Sub authentication");
	}
};
export const parseGmailPush = (body: unknown) => {
	const config = getGmailConfig();
	const parsed = envelopeSchema.safeParse(body);

	if (!parsed.success) {
		throw createHttpError.BadRequest("Invalid Pub/Sub envelope");
	}

	const envelope = parsed.data;
	if (envelope.subscription !== config.subscription) {
		throw createHttpError.Forbidden("Unexpected Pub/Sub subscription");
	}

	if (!/^[A-Za-z0-9_+/-]+={0,2}$/.test(envelope.message.data)) {
		throw createHttpError.BadRequest("Invalid Pub/Sub data encoding");
	}

	try {
		const notification = notificationSchema.parse(
			JSON.parse(
				Buffer.from(envelope.message.data, "base64url").toString("utf8"),
			),
		);

		return { ...notification, messageId: envelope.message.messageId };
	} catch {
		throw createHttpError.BadRequest("Invalid Gmail notification");
	}
};
export const gmailPushCallback = async (req: Request, res: Response) => {
	await verifyGmailPushToken(req.headers.authorization);

	let body: unknown;
	try {
		body = JSON.parse(
			Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "",
		);
	} catch {
		throw createHttpError.BadRequest("Invalid Pub/Sub JSON");
	}

	const notification = parseGmailPush(body);

	await addIntegrationEvent(
		{
			provider: "gmail",
			data: {
				mailbox: notification.emailAddress,
				historyId: notification.historyId,
			},
		},
		JSON.stringify([getGmailConfig().subscription, notification.messageId]),
	);
	return res.status(204).end();
};
