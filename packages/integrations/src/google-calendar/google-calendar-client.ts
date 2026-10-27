import { z } from "zod";

export class GoogleCalendarApiError extends Error {
	constructor(public status: number) {
		super(`Google Calendar API request failed (HTTP ${status})`);
	}
}

const calendarRequest = async (token: string, path: string, body?: unknown) => {
	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/${path}`,
		{
			method: body === undefined ? "GET" : "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
			signal: AbortSignal.timeout(15000),
		},
	);
	if (!response.ok) {
		throw new GoogleCalendarApiError(response.status);
	}
	return response;
};

const eventDateSchema = z.looseObject({
	date: z.iso.date().optional(),
	dateTime: z.iso.datetime({ offset: true }).optional(),
	timeZone: z.string().optional(),
});

export const googleCalendarEventSchema = z.looseObject({
	id: z.string().min(1),
	etag: z.string().min(1).optional(),
	status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
	summary: z.string().optional(),
	start: eventDateSchema.optional(),
	end: eventDateSchema.optional(),
});

const eventPageSchema = z
	.object({
		items: z.array(googleCalendarEventSchema).default([]),
		nextPageToken: z.string().min(1).optional(),
		nextSyncToken: z.string().min(1).optional(),
	})
	.refine(
		(page) => Boolean(page.nextPageToken) !== Boolean(page.nextSyncToken),
		"Google Calendar must return a page token or a sync token",
	);

export const getGoogleCalendarEventPage = async (
	accessToken: string,
	calendarId: string,
	checkpoint: { syncToken?: string; pageToken?: string },
) => {
	const params = new URLSearchParams({
		maxResults: "100",
		showDeleted: "true",
		singleEvents: "false",
	});
	if (checkpoint.syncToken) params.set("syncToken", checkpoint.syncToken);
	if (checkpoint.pageToken) params.set("pageToken", checkpoint.pageToken);
	const response = await calendarRequest(
		accessToken,
		`calendars/${encodeURIComponent(calendarId)}/events?${params}`,
	);
	return eventPageSchema.parse(
		await response.json().catch(() => {
			throw new Error("Google Calendar returned an invalid JSON response");
		}),
	);
};

const watchRequestSchema = z.object({
	id: z.uuid(),
	address: z.url().refine((value) => new URL(value).protocol === "https:", {
		error: "Google Calendar requires an HTTPS callback URL",
	}),
	token: z.string().min(1).max(256),
});

const watchResponseSchema = z.object({
	id: z.string().min(1),
	resourceId: z.string().min(1),
	expiration: z
		.union([z.string().regex(/^\d+$/), z.number()])
		.transform(Number)
		.pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
});

export const createGoogleCalendarWatch = async (
	accessToken: string,
	calendarId: string,
	channel: z.infer<typeof watchRequestSchema>,
) => {
	const request = watchRequestSchema.parse(channel);
	const calendar = z.string().trim().min(1).parse(calendarId);
	const response = await calendarRequest(
		accessToken,
		`calendars/${encodeURIComponent(calendar)}/events/watch`,
		{ ...request, type: "web_hook" },
	);
	const watch = watchResponseSchema.parse(
		await response.json().catch(() => {
			throw new Error("Google Calendar returned an invalid JSON response");
		}),
	);
	if (watch.id !== request.id || watch.expiration <= Date.now()) {
		throw new Error("Google Calendar returned an invalid watch registration");
	}
	return watch;
};

export const stopGoogleCalendarWatch = async (
	accessToken: string,
	channel: { id: string; resourceId: string },
) => {
	const request = watchResponseSchema
		.pick({ id: true, resourceId: true })
		.parse(channel);
	await calendarRequest(accessToken, "channels/stop", request);
};
