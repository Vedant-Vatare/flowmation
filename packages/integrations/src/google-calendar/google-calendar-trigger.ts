import { createHash, randomUUID } from "node:crypto";
import {
	and,
	db,
	eq,
	workflowSnapshotsTable as snapshots,
	integrationTriggerStateTable as triggerStates,
	userWorkflowsTable as workflows,
} from "@nodebase/db";
import { addWorkflowInQueue } from "@nodebase/queue";
import { googleCalendarTriggerNodeSchema } from "@nodebase/shared";
import { z } from "zod";
import {
	acceptTriggerEvent,
	claimTriggerEvent,
	releaseTriggerEvent,
} from "../webhook-utils.js";
import {
	GoogleCalendarApiError,
	getGoogleCalendarEventPage,
} from "./google-calendar-client.js";
import { getGoogleCalendarAccessToken } from "./google-calendar-credentials.js";
import {
	GOOGLE_CALENDAR_PROVIDER,
	googleCalendarStateSchema,
	saveGoogleCalendarState,
} from "./google-calendar-trigger-state.js";

const notificationSchema = z
	.object({
		triggerStateId: z.uuid(),
		channelId: z.uuid().optional(),
		resourceId: z.string().min(1).optional(),
	})
	.refine(
		(value) =>
			(value.channelId === undefined) === (value.resourceId === undefined),
		"A Calendar notification must include both channel and resource IDs",
	);

const readGoogleCalendarTrigger = async (
	notification: z.infer<typeof notificationSchema>,
) => {
	const [record] = await db
		.select({
			state: triggerStates,
			userId: workflows.userId,
			status: workflows.status,
			nodes: snapshots.nodes,
			connections: snapshots.connections,
		})
		.from(triggerStates)
		.innerJoin(workflows, eq(workflows.id, triggerStates.workflowId))
		.leftJoin(snapshots, eq(snapshots.workflowId, triggerStates.workflowId))
		.where(
			and(
				eq(triggerStates.id, notification.triggerStateId),
				eq(triggerStates.provider, GOOGLE_CALENDAR_PROVIDER),
			),
		);
	if (!record) return;
	const { state, nodes, connections } = record;
	const node = nodes?.find(
		(candidate) =>
			candidate.id === state.triggerNodeId &&
			candidate.task === "trigger.google_calendar" &&
			!candidate.settings?.disabled,
	);
	if (record.status !== "active" || !nodes || !connections || !node) return;
	if (!state.credentialId || node.credentialId !== state.credentialId) {
		throw new Error(
			"Reconnect the Google credential and republish this Calendar trigger",
		);
	}
	const value = googleCalendarStateSchema.parse(state.value);
	if (notification.channelId) {
		const channel = value.channels.find(
			(candidate) => candidate.id === notification.channelId,
		);
		if (!channel) return;
		if (!channel.resourceId) {
			throw new Error(
				"Calendar watch registration is not ready; retry the notification",
			);
		}
		if (channel.resourceId !== notification.resourceId) return;
	}
	const [calendar, event, title, allDay] =
		googleCalendarTriggerNodeSchema.parse(node).parameters;
	if (
		calendar.value !== value.calendarId ||
		event.value !== value.event ||
		title.value !== value.titleContains ||
		allDay.value !== value.includeAllDay
	) {
		throw new Error(
			"Republish the Calendar workflow to update its trigger settings",
		);
	}
	return {
		state,
		value,
		nodes,
		connections,
		userId: record.userId,
		credentialId: state.credentialId,
	};
};

const syncGoogleCalendarTrigger = async (
	notification: z.infer<typeof notificationSchema>,
) => {
	const record = await readGoogleCalendarTrigger(notification);
	if (!record) return;
	const { state, value, nodes, connections } = record;
	const token = await getGoogleCalendarAccessToken(
		record.credentialId,
		record.userId,
	);
	let page: Awaited<ReturnType<typeof getGoogleCalendarEventPage>>;
	try {
		page = await getGoogleCalendarEventPage(token, value.calendarId, value);
	} catch (error) {
		if (
			error instanceof GoogleCalendarApiError &&
			error.status === 400 &&
			value.pageToken
		) {
			await db
				.update(triggerStates)
				.set({
					value: { ...value, pageToken: undefined },
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(triggerStates.id, state.id),
						eq(triggerStates.value, state.value),
					),
				);
			throw new Error(
				"Calendar page token expired; retry from the saved sync position",
			);
		}
		if (error instanceof GoogleCalendarApiError && error.status === 410) {
			throw new Error(
				"Calendar sync token expired. Unpublish and publish again to resume changes; missed changes are not recovered.",
			);
		}
		throw error;
	}
	if (page.nextPageToken && page.nextPageToken === value.pageToken) {
		throw new Error("Google Calendar pagination did not advance");
	}
	const events = new Map(Object.entries(value.events));
	const changes: { sourceId: string; data: unknown }[] = [];
	for (const event of page.items) {
		const previous = events.get(event.id);
		const cancelled = event.status === "cancelled";
		if (!cancelled && !event.etag) {
			throw new Error("Google Calendar returned an event without a version");
		}
		const etag =
			event.etag ??
			(previous?.status === "cancelled"
				? previous.etag
				: `cancelled:${previous?.etag ?? event.id}`);
		const current = cancelled
			? { ...previous, ...event, etag }
			: { ...event, etag };
		events.set(event.id, current);
		if (!value.syncToken) continue;
		if (previous?.etag === etag && previous.status === current.status) continue;
		const changeType = cancelled
			? "cancelled"
			: previous
				? "updated"
				: "created";
		if (
			value.event !== changeType &&
			!(value.event === "created_or_updated" && !cancelled)
		)
			continue;
		if (!value.includeAllDay && !current.start?.dateTime) continue;
		if (
			value.titleContains &&
			!(current.summary ?? "")
				.toLowerCase()
				.includes(value.titleContains.toLowerCase())
		)
			continue;
		changes.push({
			sourceId: JSON.stringify([
				GOOGLE_CALENDAR_PROVIDER,
				state.resourceKey,
				event.id,
				etag,
				changeType,
			]),
			data: { ...current, calendarId: value.calendarId, changeType },
		});
	}
	return db.transaction(async (tx) => {
		const [workflow] = await tx
			.select({ status: workflows.status })
			.from(workflows)
			.where(
				and(
					eq(workflows.id, state.workflowId),
					eq(workflows.userId, record.userId),
				),
			)
			.for("update");
		if (workflow?.status !== "active") return;
		const [current] = await tx
			.select({ id: triggerStates.id })
			.from(triggerStates)
			.innerJoin(snapshots, eq(snapshots.workflowId, triggerStates.workflowId))
			.where(
				and(
					eq(triggerStates.id, state.id),
					eq(triggerStates.value, state.value),
					eq(triggerStates.credentialId, record.credentialId),
					eq(snapshots.nodes, nodes),
					eq(snapshots.connections, connections),
				),
			)
			.for("update", { of: triggerStates });
		if (!current) {
			throw new Error(
				"Calendar trigger changed during processing; retry with its latest checkpoint",
			);
		}
		for (const change of changes) {
			const claim = await claimTriggerEvent(
				state.workflowId,
				state.triggerNodeId,
				change.sourceId,
			);
			if (!claim) continue;
			try {
				const jobId = createHash("sha256")
					.update(
						JSON.stringify([
							state.workflowId,
							state.triggerNodeId,
							change.sourceId,
						]),
					)
					.digest("hex");
				await addWorkflowInQueue(
					{
						executionId: randomUUID(),
						workflowId: state.workflowId,
						userId: record.userId,
						triggerNodeId: state.triggerNodeId,
						triggerType: "webhook",
						triggerData: change.data,
						nodes,
						connections,
					},
					jobId,
				);
				await acceptTriggerEvent(claim);
			} catch (error) {
				await releaseTriggerEvent(claim);
				throw error;
			}
		}
		await saveGoogleCalendarState(tx, state.id, {
			...value,
			events: Object.fromEntries(events),
			syncToken: page.nextSyncToken ?? value.syncToken,
			pageToken: page.nextPageToken,
		});
		return page.nextPageToken;
	});
};

export const processGoogleCalendarNotification = async (input: unknown) => {
	const notification = notificationSchema.parse(input);
	const seenPageTokens = new Set<string>();
	while (true) {
		const nextPageToken = await syncGoogleCalendarTrigger(notification);
		if (!nextPageToken) return;
		if (seenPageTokens.has(nextPageToken)) {
			throw new Error("Google Calendar pagination repeated a page token");
		}
		seenPageTokens.add(nextPageToken);
	}
};
