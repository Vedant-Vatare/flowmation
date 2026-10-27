import { type db, eq, integrationTriggerStateTable } from "@nodebase/db";
import { googleCalendarTriggerNodeValueSchemas } from "@nodebase/shared";
import { z } from "zod";

export const GOOGLE_CALENDAR_PROVIDER = "google_calendar";

const channelSchema = z
	.object({
		id: z.uuid(),
		token: z.string().min(1).max(256),
		resourceId: z.string().min(1).optional(),
		expiresAt: z
			.number()
			.int()
			.positive()
			.max(Number.MAX_SAFE_INTEGER)
			.optional(),
	})
	.refine(
		(channel) =>
			(channel.resourceId === undefined) === (channel.expiresAt === undefined),
		"A registered channel must have both a resource ID and an expiration",
	);

const storedEventSchema = z.looseObject({
	id: z.string().min(1),
	etag: z.string().min(1),
	summary: z.string().optional(),
	status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
	start: z
		.object({
			date: z.iso.date().optional(),
			dateTime: z.iso.datetime({ offset: true }).optional(),
			timeZone: z.string().optional(),
		})
		.optional(),
});

export const googleCalendarStateSchema = z.object({
	calendarId: googleCalendarTriggerNodeValueSchemas.calendarId,
	callbackUrl: z.url().startsWith("https://").optional(),
	event: googleCalendarTriggerNodeValueSchemas.event,
	titleContains: googleCalendarTriggerNodeValueSchemas.titleContains,
	includeAllDay: googleCalendarTriggerNodeValueSchemas.includeAllDay,
	channels: z
		.array(channelSchema)
		.min(1)
		.refine(
			(channels) =>
				new Set(channels.map((channel) => channel.id)).size === channels.length,
			"Calendar channel IDs must be unique",
		),
	syncToken: z.string().min(1).optional(),
	pageToken: z.string().min(1).optional(),
	events: z.record(z.string(), storedEventSchema).default({}),
});

export type GoogleCalendarState = z.infer<typeof googleCalendarStateSchema>;
type TriggerTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const saveGoogleCalendarState = async (
	tx: TriggerTransaction,
	id: string,
	value: GoogleCalendarState,
) => {
	await tx
		.update(integrationTriggerStateTable)
		.set({
			value: googleCalendarStateSchema.parse(value),
			updatedAt: new Date(),
		})
		.where(eq(integrationTriggerStateTable.id, id));
};
