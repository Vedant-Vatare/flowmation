import { randomBytes, randomUUID } from "node:crypto";
import {
	and,
	db,
	eq,
	sql,
	integrationTriggerStateTable as triggerStates,
	userWorkflowsTable as workflows,
} from "@nodebase/db";
import { addIntegrationEvent } from "@nodebase/queue";
import {
	googleCalendarTriggerNodeSchema,
	type WorkflowNode,
} from "@nodebase/shared";
import createHttpError from "http-errors";
import { z } from "zod";
import {
	createGoogleCalendarWatch,
	GoogleCalendarApiError,
	getGoogleCalendarEventPage,
	stopGoogleCalendarWatch,
} from "./google-calendar-client.js";
import { getGoogleCalendarAccessToken } from "./google-calendar-credentials.js";
import {
	GOOGLE_CALENDAR_PROVIDER,
	type GoogleCalendarState,
	googleCalendarStateSchema,
	saveGoogleCalendarState,
} from "./google-calendar-trigger-state.js";

type TriggerTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Channel = GoogleCalendarState["channels"][number];
type WatchCleanup = {
	channel: Channel;
	credentialId: string | null;
	userId: string;
};

const getCallbackUrl = () => {
	const base = z
		.url()
		.startsWith("https://")
		.safeParse(process.env.API_SERVER_URL);
	if (!base.success) {
		throw createHttpError.ServiceUnavailable(
			"Set API_SERVER_URL to the public HTTPS server URL for Calendar triggers",
		);
	}
	return new URL("/api/v1/triggers/google-calendar/push", base.data).toString();
};

const hasHealthyWatch = (value: GoogleCalendarState, callbackUrl: string) => {
	return (
		value.callbackUrl === callbackUrl &&
		value.channels.some(
			(channel) =>
				channel.resourceId && (channel.expiresAt ?? 0) > Date.now() + 86400000,
		)
	);
};

const createChannel = async (
	accessToken: string,
	calendarId: string,
	address: string,
): Promise<Channel> => {
	const channel = { id: randomUUID(), token: randomBytes(32).toString("hex") };
	const watch = await createGoogleCalendarWatch(accessToken, calendarId, {
		...channel,
		address,
	});
	return {
		...channel,
		resourceId: watch.resourceId,
		expiresAt: watch.expiration,
	};
};

const cleanupUnusedWatches = async (watches: WatchCleanup[]) => {
	for (const { channel, credentialId, userId } of watches) {
		if (!channel.resourceId || (channel.expiresAt ?? 0) <= Date.now()) continue;
		try {
			const [used] = await db
				.select({ id: triggerStates.id })
				.from(triggerStates)
				.where(
					and(
						eq(triggerStates.provider, GOOGLE_CALENDAR_PROVIDER),
						sql`${triggerStates.value}->'channels' @> ${JSON.stringify([{ id: channel.id }])}::jsonb`,
					),
				);
			if (used) continue;
			const token = await getGoogleCalendarAccessToken(credentialId, userId);
			await stopGoogleCalendarWatch(token, {
				id: channel.id,
				resourceId: channel.resourceId,
			});
		} catch (error) {
			if (
				error instanceof GoogleCalendarApiError &&
				(error.status === 404 || error.status === 410)
			)
				continue;
			console.error(
				"Could not stop an unused Calendar watch",
				error instanceof Error ? error.message : "Check the Google credential",
			);
		}
	}
};

const readBaseline = async (accessToken: string, calendarId: string) => {
	const events = new Map<string, GoogleCalendarState["events"][string]>();
	let pageToken: string | undefined;
	const seen = new Set<string>();
	while (true) {
		const page = await getGoogleCalendarEventPage(accessToken, calendarId, {
			pageToken,
		});
		for (const event of page.items) {
			if (!event.etag && event.status !== "cancelled") {
				throw new Error("Google Calendar returned an event without a version");
			}
			events.set(event.id, {
				...event,
				etag: event.etag ?? `cancelled:${event.id}`,
			});
		}
		if (page.nextSyncToken)
			return {
				events: Object.fromEntries(events),
				syncToken: page.nextSyncToken,
			};
		if (!page.nextPageToken || seen.has(page.nextPageToken)) {
			throw new Error("Google Calendar baseline pagination did not advance");
		}
		pageToken = page.nextPageToken;
		seen.add(pageToken);
	}
};

export const prepareGoogleCalendarWorkflow = async (
	workflowId: string,
	userId: string,
	nodes: WorkflowNode[],
) => {
	const previous = await db
		.select()
		.from(triggerStates)
		.where(
			and(
				eq(triggerStates.provider, GOOGLE_CALENDAR_PROVIDER),
				eq(triggerStates.workflowId, workflowId),
			),
		);
	const enabled = nodes.filter(
		(node) =>
			node.task === "trigger.google_calendar" && !node.settings?.disabled,
	);
	const callbackUrl = enabled.length ? getCallbackUrl() : "";
	const created: WatchCleanup[] = [];
	const retired: WatchCleanup[] = [];
	const prepared: {
		id: string;
		node: WorkflowNode;
		value: GoogleCalendarState;
		sameResource: boolean;
	}[] = [];
	try {
		for (const node of enabled) {
			const [calendar, event, title, allDay] =
				googleCalendarTriggerNodeSchema.parse(node).parameters;
			const token = await getGoogleCalendarAccessToken(
				node.credentialId,
				userId,
			);
			const current = previous.find((state) => state.triggerNodeId === node.id);
			const saved = current
				? googleCalendarStateSchema.parse(current.value)
				: undefined;
			const sameResource = Boolean(
				saved &&
					saved.calendarId === calendar.value &&
					current?.credentialId === node.credentialId,
			);
			const baseline =
				sameResource && saved
					? saved
					: await readBaseline(token, calendar.value);
			let channels = sameResource && saved ? saved.channels : [];
			if (!saved || !sameResource || !hasHealthyWatch(saved, callbackUrl)) {
				const channel = await createChannel(token, calendar.value, callbackUrl);
				created.push({ channel, credentialId: node.credentialId, userId });
				channels = [channel];
			}
			prepared.push({
				id: sameResource && current ? current.id : randomUUID(),
				node,
				sameResource,
				value: googleCalendarStateSchema.parse({
					...baseline,
					calendarId: calendar.value,
					callbackUrl,
					event: event.value,
					titleContains: title.value,
					includeAllDay: allDay.value,
					channels,
				}),
			});
		}
	} catch (error) {
		await cleanupUnusedWatches(created);
		throw error;
	}
	const save = async (tx: TriggerTransaction) => {
		const current = await tx
			.select()
			.from(triggerStates)
			.where(
				and(
					eq(triggerStates.provider, GOOGLE_CALENDAR_PROVIDER),
					eq(triggerStates.workflowId, workflowId),
				),
			)
			.for("update");
		if (
			current.length !== previous.length ||
			current.some(
				(state) =>
					!previous.some(
						(saved) =>
							saved.id === state.id &&
							saved.credentialId === state.credentialId &&
							saved.resourceKey === state.resourceKey &&
							saved.value.calendarId === state.value.calendarId &&
							saved.value.event === state.value.event &&
							saved.value.titleContains === state.value.titleContains &&
							saved.value.includeAllDay === state.value.includeAllDay &&
							saved.value.callbackUrl === state.value.callbackUrl,
					),
			)
		) {
			throw new Error(
				"Calendar registrations changed while publishing; retry with their latest state",
			);
		}
		for (const state of current) {
			if (!prepared.some((candidate) => candidate.id === state.id)) {
				retired.push(
					...googleCalendarStateSchema
						.parse(state.value)
						.channels.map((channel) => ({
							channel,
							credentialId: state.credentialId,
							userId,
						})),
				);
				await tx.delete(triggerStates).where(eq(triggerStates.id, state.id));
			}
		}
		for (const candidate of prepared) {
			const currentState = current.find((state) => state.id === candidate.id);
			let value = candidate.value;
			if (candidate.sameResource && currentState) {
				const latest = googleCalendarStateSchema.parse(currentState.value);
				const replaceWatch = created.some(
					(watch) => watch.channel.id === candidate.value.channels[0]?.id,
				);
				if (replaceWatch)
					retired.push(
						...latest.channels.map((channel) => ({
							channel,
							credentialId: currentState.credentialId,
							userId,
						})),
					);
				value = {
					...latest,
					callbackUrl: candidate.value.callbackUrl,
					event: candidate.value.event,
					titleContains: candidate.value.titleContains,
					includeAllDay: candidate.value.includeAllDay,
					channels: replaceWatch ? candidate.value.channels : latest.channels,
				};
			}
			if (currentState) {
				await saveGoogleCalendarState(tx, candidate.id, value);
			} else {
				await tx.insert(triggerStates).values({
					id: candidate.id,
					provider: GOOGLE_CALENDAR_PROVIDER,
					resourceKey: JSON.stringify([
						candidate.node.credentialId,
						value.calendarId,
					]),
					workflowId,
					triggerNodeId: candidate.node.id,
					credentialId: candidate.node.credentialId,
					value: googleCalendarStateSchema.parse(value),
				});
			}
		}
	};
	const afterPublish = async () => {
		try {
			for (const candidate of prepared) {
				await addIntegrationEvent({
					provider: GOOGLE_CALENDAR_PROVIDER,
					data: { triggerStateId: candidate.id },
				});
			}
		} finally {
			await cleanupUnusedWatches([...retired, ...created]);
		}
	};
	return { save, afterPublish, rollback: () => cleanupUnusedWatches(created) };
};

let renewingWatches = false;
const renewGoogleCalendarWatches = async () => {
	if (renewingWatches) return;
	renewingWatches = true;
	try {
		const callbackUrl = getCallbackUrl();
		const registrations = await db
			.select({ state: triggerStates, userId: workflows.userId })
			.from(triggerStates)
			.innerJoin(workflows, eq(workflows.id, triggerStates.workflowId))
			.where(
				and(
					eq(triggerStates.provider, GOOGLE_CALENDAR_PROVIDER),
					eq(workflows.status, "active"),
				),
			);
		for (const { state, userId } of registrations) {
			let created: WatchCleanup | undefined;
			try {
				const value = googleCalendarStateSchema.parse(state.value);
				if (hasHealthyWatch(value, callbackUrl)) continue;
				const token = await getGoogleCalendarAccessToken(
					state.credentialId,
					userId,
				);
				const channel = await createChannel(
					token,
					value.calendarId,
					callbackUrl,
				);
				created = { channel, credentialId: state.credentialId, userId };
				let retiredChannels: Channel[] = [];
				const saved = await db.transaction(async (tx) => {
					const [workflow] = await tx
						.select({ status: workflows.status })
						.from(workflows)
						.where(
							and(
								eq(workflows.id, state.workflowId),
								eq(workflows.userId, userId),
							),
						)
						.for("update");
					if (workflow?.status !== "active") return false;
					const [current] = await tx
						.select()
						.from(triggerStates)
						.where(eq(triggerStates.id, state.id))
						.for("update");
					if (
						!current ||
						current.credentialId !== state.credentialId ||
						current.resourceKey !== state.resourceKey
					)
						return false;
					const latest = googleCalendarStateSchema.parse(current.value);
					retiredChannels = latest.channels;
					await saveGoogleCalendarState(tx, state.id, {
						...latest,
						callbackUrl,
						channels: [channel],
					});
					return true;
				});
				if (saved) {
					try {
						await addIntegrationEvent({
							provider: GOOGLE_CALENDAR_PROVIDER,
							data: { triggerStateId: state.id },
						});
					} finally {
						await cleanupUnusedWatches(
							retiredChannels.map((old) => ({
								channel: old,
								credentialId: state.credentialId,
								userId,
							})),
						);
					}
				}
			} catch (error) {
				console.error(
					"Calendar watch renewal failed",
					error instanceof Error ? error.message : "Reconnect Google",
				);
			} finally {
				if (created) await cleanupUnusedWatches([created]);
			}
		}
	} finally {
		renewingWatches = false;
	}
};

export const startGoogleCalendarWatchRenewal = () => {
	if (!process.env.API_SERVER_URL) return;
	try {
		getCallbackUrl();
	} catch {
		console.error(
			"API_SERVER_URL must use public HTTPS; Calendar watch renewal is disabled",
		);
		return;
	}
	const renew = () => {
		renewGoogleCalendarWatches().catch(() =>
			console.error("Could not renew Calendar watches"),
		);
	};
	renew();
	return setInterval(renew, 3600000).unref();
};
