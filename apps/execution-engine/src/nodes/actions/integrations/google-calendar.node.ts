import type { GoogleCalendarNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleGoogleAPIResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const normalizeDateTime = (dt: string): string => {
	if (!dt) return dt;
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return `${dt}:00`;
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dt)) return dt;
	return dt;
};

export const googleCalendarNodeExecutor = async (
	node: GoogleCalendarNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Google Calendar node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for Google Calendar",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation)
			throw new UnrecoverableError("google calendar node operation is invalid");

		const calendarId = (params.calendarId?.value as string) || "primary";
		const authHeaders = {
			Authorization: `Bearer ${credential.accessToken}`,
			"Content-Type": "application/json",
		};

		if (operation === "list_events") {
			const url = new URL(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
			);

			const timeMin = params.timeMin?.value as string | undefined;
			const timeMax = params.timeMax?.value as string | undefined;
			const maxResults = params.maxResults?.value as string | undefined;
			const query = params.query?.value as string | undefined;

			if (timeMin) url.searchParams.set("timeMin", timeMin);
			if (timeMax) url.searchParams.set("timeMax", timeMax);
			if (maxResults) url.searchParams.set("maxResults", maxResults);
			if (query) url.searchParams.set("q", query);

			const response = await fetch(url.toString(), {
				headers: { Authorization: `Bearer ${credential.accessToken}` },
			});

			return handleGoogleAPIResponse(response);
		}

		if (operation === "create_event") {
			const summary = params.summary?.value as string;
			const description = params.description?.value as string | undefined;
			const location = params.location?.value as string | undefined;
			const startTime = normalizeDateTime(params.startTime?.value as string);
			let endTime = params.endTime?.value
				? normalizeDateTime(params.endTime?.value as string)
				: undefined;
			const timeZone = (params.timeZone?.value as string) || "UTC";

			if (!endTime) {
				const d = new Date(startTime);
				d.setHours(d.getHours() + 1);
				endTime = d.toISOString().replace(/\.\d+Z$/, "");
			}

			const body: Record<string, unknown> = {
				summary,
				description,
				location,
				start: { dateTime: startTime, timeZone },
				end: { dateTime: endTime, timeZone },
			};

			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
				{
					method: "POST",
					headers: authHeaders,
					body: JSON.stringify(body),
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "update_event") {
			const eventId = params.eventId?.value as string;
			if (!eventId) return { success: false, message: "Event ID is required" };

			const body: Record<string, unknown> = {};
			const summary = params.summary?.value as string | undefined;
			const description = params.description?.value as string | undefined;
			const location = params.location?.value as string | undefined;
			const startTime = params.startTime?.value
				? normalizeDateTime(params.startTime?.value as string)
				: undefined;
			const endTime = params.endTime?.value
				? normalizeDateTime(params.endTime?.value as string)
				: undefined;
			const timeZone = (params.timeZone?.value as string) || "UTC";

			if (summary) body.summary = summary;
			if (description) body.description = description;
			if (location) body.location = location;
			if (startTime) body.start = { dateTime: startTime, timeZone };
			if (endTime) body.end = { dateTime: endTime, timeZone };

			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
				{
					method: "PUT",
					headers: authHeaders,
					body: JSON.stringify(body),
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "delete_event") {
			const eventId = params.eventId?.value as string;
			if (!eventId) return { success: false, message: "Event ID is required" };

			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${credential.accessToken}`,
					},
				},
			);

			if (!response.ok) {
				const data = (await response.json().catch(() => ({}))) as Record<
					string,
					unknown
				>;
				const errorData = data.error as { message?: string } | undefined;
				return {
					success: false,
					message:
						errorData?.message || `Failed to delete event (${response.status})`,
				};
			}

			return { success: true, message: "Event deleted" };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Google Calendar node",
		};
	}
};
