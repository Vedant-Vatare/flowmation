import { timingSafeEqual } from "node:crypto";
import { and, db, eq, integrationTriggerStateTable, sql } from "@nodebase/db";
import {
	GOOGLE_CALENDAR_PROVIDER,
	googleCalendarStateSchema,
} from "@nodebase/integrations";
import { addIntegrationEvent } from "@nodebase/queue";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";

const notificationSchema = z.object({
	channelId: z.uuid(),
	token: z.string().min(1).max(256),
	resourceId: z.string().min(1).max(2048),
	state: z.enum(["sync", "exists", "not_exists"]),
	messageNumber: z
		.string()
		.regex(/^[1-9]\d*$/)
		.max(128),
});

export const googleCalendarPushCallback = async (
	req: Request,
	res: Response,
) => {
	const parsed = notificationSchema.safeParse({
		channelId: req.headers["x-goog-channel-id"],
		token: req.headers["x-goog-channel-token"],
		resourceId: req.headers["x-goog-resource-id"],
		state: req.headers["x-goog-resource-state"],
		messageNumber: req.headers["x-goog-message-number"],
	});
	if (!parsed.success) {
		throw createHttpError.BadRequest("Invalid Google Calendar notification");
	}
	const notification = parsed.data;
	const registrations = await db
		.select({
			id: integrationTriggerStateTable.id,
			channels: sql<unknown>`${integrationTriggerStateTable.value}->'channels'`,
		})
		.from(integrationTriggerStateTable)
		.where(
			and(
				eq(integrationTriggerStateTable.provider, GOOGLE_CALENDAR_PROVIDER),
				sql`${integrationTriggerStateTable.value}->'channels' @> ${JSON.stringify([{ id: notification.channelId }])}::jsonb`,
			),
		);
	if (registrations.length === 0) {
		return res.status(204).end();
	}
	for (const registration of registrations) {
		const channels = googleCalendarStateSchema.shape.channels.parse(
			registration.channels,
		);
		const channel = channels.find(
			(candidate) => candidate.id === notification.channelId,
		);
		if (!channel) continue;
		const expected = Buffer.from(channel.token);
		const received = Buffer.from(notification.token);
		if (
			expected.length !== received.length ||
			!timingSafeEqual(expected, received)
		) {
			throw createHttpError.Unauthorized(
				"Invalid Google Calendar channel token",
			);
		}
		if (channel.resourceId && channel.resourceId !== notification.resourceId) {
			throw createHttpError.Forbidden("Unexpected Google Calendar resource");
		}
		if (channel.expiresAt && channel.expiresAt <= Date.now()) continue;
		if (notification.state === "sync") continue;
		await addIntegrationEvent(
			{
				provider: GOOGLE_CALENDAR_PROVIDER,
				data: {
					triggerStateId: registration.id,
					channelId: notification.channelId,
					resourceId: notification.resourceId,
				},
			},
			JSON.stringify([
				registration.id,
				notification.channelId,
				notification.messageNumber,
			]),
		);
	}
	return res.status(204).end();
};
