import type { CalcomNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const CALCOM_BASE = "https://api.cal.com/v2";

const apiVersionFor = (path: string): string => {
	if (path.startsWith("/event-types")) return "2024-06-14";
	if (path.startsWith("/slots")) return "2024-09-04";
	return "2024-08-13";
};

const toUTC = (v: unknown): string => {
	const d = new Date(v as string);
	return Number.isNaN(d.getTime()) ? (v as string) : d.toISOString();
};

const toErrorMessage = (err: unknown): string => {
	if (typeof err === "string") return err;
	if (
		err &&
		typeof err === "object" &&
		"message" in err &&
		typeof err.message === "string"
	)
		return err.message;
	return JSON.stringify(err);
};

const callCalApi = async (
	path: string,
	apiKey: string,
	options: RequestInit = {},
) => {
	const response = await fetch(`${CALCOM_BASE}${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"cal-api-version": apiVersionFor(path),
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (response.status === 429) {
		const retryAfter = response.headers.get("Retry-After") ?? "60";
		throw new Error(`Cal.com rate limited. Retry after ${retryAfter}s`);
	}

	let data: Record<string, unknown>;
	try {
		data = (await response.json()) as Record<string, unknown>;
	} catch {
		return { success: false, message: `Cal.com API error: ${response.status}` };
	}

	if (!response.ok) {
		const message =
			toErrorMessage(data.error) ||
			toErrorMessage(data.message) ||
			`Cal.com API error: ${response.status}`;
		return { success: false, message };
	}

	return { success: true, data: data.data ?? data };
};

export const calcomNodeExecutor = async (
	node: CalcomNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Cal.com node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value;

	if (!operation)
		throw new UnrecoverableError("calcom node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Cal.com",
			};
		}

		const apiKey = credential.fields.apiKey;

		if (operation === "create_booking") {
			const eventTypeId = params.eventTypeId?.value;
			const startTime = toUTC(params.startTime?.value);
			const attendeeName = params.attendeeName?.value;
			const attendeeEmail = params.attendeeEmail?.value;

			if (!eventTypeId || !startTime || !attendeeName || !attendeeEmail) {
				return {
					success: false,
					message:
						"Event Type ID, start time, attendee name, and attendee email are required",
				};
			}

			const result = await callCalApi("/bookings", apiKey, {
				method: "POST",
				body: JSON.stringify({
					eventTypeId,
					start: startTime,
					attendee: {
						name: attendeeName,
						email: attendeeEmail,
						timeZone: "UTC",
					},
				}),
			});

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "cancel_booking") {
			const bookingUid = params.bookingUid?.value;
			const reason = params.reason?.value;

			if (!bookingUid) {
				return {
					success: false,
					message: "Booking UID is required",
				};
			}

			const result = await callCalApi(
				`/bookings/${bookingUid}/cancel`,
				apiKey,
				{
					method: "POST",
					body: JSON.stringify(reason ? { reason } : {}),
				},
			);

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "reschedule_booking") {
			const bookingUid = params.bookingUid?.value;
			const startTime = toUTC(params.startTime?.value);

			if (!bookingUid || !startTime) {
				return {
					success: false,
					message: "Booking UID and start time are required",
				};
			}

			const result = await callCalApi(
				`/bookings/${bookingUid}/reschedule`,
				apiKey,
				{
					method: "POST",
					body: JSON.stringify({
						start: startTime,
					}),
				},
			);

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "list_bookings") {
			const status = params.status?.value;
			const limit = params.limit?.value;

			const queryParams = new URLSearchParams();
			if (status) queryParams.set("status", status);
			if (limit) queryParams.set("limit", String(limit));

			const query = queryParams.toString();
			const result = await callCalApi(
				`/bookings${query ? `?${query}` : ""}`,
				apiKey,
			);

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "list_event_types") {
			const result = await callCalApi("/event-types", apiKey);

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "get_availability_slots") {
			const eventTypeId = params.eventTypeId?.value;
			const startDate = params.startDate?.value;
			const endDate = params.endDate?.value;
			const timezone = params.timezone?.value || "UTC";

			if (!eventTypeId || !startDate) {
				return {
					success: false,
					message: "Event Type ID and start date are required",
				};
			}

			const queryParams = new URLSearchParams({
				eventTypeId: String(eventTypeId),
				start: startDate,
				end: endDate || startDate,
				timeZone: timezone,
			});

			const result = await callCalApi(
				`/slots?${queryParams.toString()}`,
				apiKey,
			);

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Cal.com node",
		};
	}
};
