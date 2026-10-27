import { createHash, randomUUID } from "node:crypto";
import {
	and,
	credentialsTable,
	db,
	eq,
	getDecryptedCredential,
	workflowSnapshotsTable as snapshots,
	sql,
	integrationTriggerStateTable as triggerStates,
	userWorkflowsTable as workflows,
} from "@nodebase/db";
import { addIntegrationEvent, addWorkflowInQueue } from "@nodebase/queue";
import { gmailTriggerNodeSchema, type WorkflowNode } from "@nodebase/shared";
import createHttpError from "http-errors";
import { z } from "zod";
import type { TriggerSetup } from "../triggers.registry.js";
import {
	acceptTriggerEvent,
	claimTriggerEvent,
	releaseTriggerEvent,
} from "../webhook-utils.js";
import {
	GmailApiError,
	type GmailMessage,
	getGmailArrivalLabels,
	getGmailMessageOutput,
	gmailHistorySchema,
	gmailMessageSchema,
	gmailProfileSchema,
	gmailRequest,
	gmailWatchSchema,
	isMatchingGmailMessage,
} from "./gmail-client.js";
import {
	GMAIL_PROVIDER,
	type GmailState,
	gmailStateSchema,
	saveGmailState,
} from "./gmail-trigger-state.js";

const configSchema = z
	.object({
		topic: z.string().regex(/^projects\/[^/]+\/topics\/[^/]+$/),
		subscription: z.string().regex(/^projects\/[^/]+\/subscriptions\/[^/]+$/),
		audience: z.url().startsWith("https://"),
		serviceAccount: z.email().endsWith(".iam.gserviceaccount.com"),
	})
	.refine((config) => {
		return config.topic.split("/")[1] === config.subscription.split("/")[1];
	}, "Gmail topic and subscription must use the same project");

export const getGmailConfig = () => {
	const config = configSchema.safeParse({
		topic: process.env.GMAIL_PUBSUB_TOPIC,
		subscription: process.env.GMAIL_PUBSUB_SUBSCRIPTION,
		audience: process.env.GMAIL_PUBSUB_AUDIENCE,
		serviceAccount: process.env.GMAIL_PUBSUB_SERVICE_ACCOUNT,
	});
	if (!config.success) {
		throw createHttpError.ServiceUnavailable(
			"Gmail Pub/Sub is not configured on this server",
		);
	}
	return config.data;
};

const accessTokenRequests = new Map<string, Promise<string>>();
const getGoogleAccessToken = async (
	credentialId: string | null,
	userId: string,
) => {
	const credential = credentialId
		? await db.query.credentialsTable.findFirst({
				where: and(
					eq(credentialsTable.id, credentialId),
					eq(credentialsTable.userId, userId),
				),
			})
		: undefined;
	if (
		!credential ||
		credential.provider !== "google" ||
		credential.type !== "oauth"
	) {
		throw createHttpError.BadRequest(
			"Select a Google credential belonging to this workflow's owner",
		);
	}
	const pending = accessTokenRequests.get(credential.id);
	if (pending) {
		return pending;
	}
	const request = (async () => {
		const decrypted = await getDecryptedCredential(credential.id);
		if (decrypted.type !== "oauth2" || !decrypted.accessToken) {
			throw new Error("Reconnect the Google credential for this Gmail trigger");
		}
		return decrypted.accessToken;
	})();
	accessTokenRequests.set(credential.id, request);
	try {
		return await request;
	} finally {
		accessTokenRequests.delete(credential.id);
	}
};

const pendingWatches = new Map<string, Promise<number>>();
const ensureMailboxWatch = async (
	token: string,
	mailbox: string,
	topic: string,
) => {
	const key = JSON.stringify([mailbox, topic]);
	const pending = pendingWatches.get(key);
	if (pending) {
		return pending;
	}
	const renewal = (async () => {
		const registrations = await db
			.select({ value: triggerStates.value })
			.from(triggerStates)
			.where(
				and(
					eq(triggerStates.provider, GMAIL_PROVIDER),
					eq(triggerStates.resourceKey, mailbox),
				),
			);
		let expiresAt = 0;
		for (const registration of registrations) {
			const saved = gmailStateSchema.safeParse(registration.value);
			if (saved.success && saved.data.topic === topic) {
				expiresAt = Math.max(expiresAt, saved.data.expiresAt);
			}
		}
		if (expiresAt <= Date.now() + 86400000) {
			const watch = gmailWatchSchema.parse(
				await gmailRequest(token, "watch", { topicName: topic }),
			);
			expiresAt = Number(watch.expiration);
			if (
				!Number.isSafeInteger(expiresAt) ||
				expiresAt <= Date.now() + 86400000
			) {
				throw new Error("Gmail returned an invalid watch expiration");
			}
		}
		await db
			.update(triggerStates)
			.set({
				value: sql`jsonb_set(${triggerStates.value}, '{expiresAt}', ${JSON.stringify(expiresAt)}::jsonb)`,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(triggerStates.provider, GMAIL_PROVIDER),
					eq(triggerStates.resourceKey, mailbox),
					sql`${triggerStates.value}->>'topic' = ${topic}`,
					sql`(${triggerStates.value}->>'expiresAt')::numeric < ${expiresAt}`,
				),
			);
		return expiresAt;
	})();
	pendingWatches.set(key, renewal);
	try {
		return await renewal;
	} finally {
		pendingWatches.delete(key);
	}
};

const renewGmailMailbox = async (mailbox: string) => {
	const registrations = await db
		.select({
			credentialId: triggerStates.credentialId,
			userId: workflows.userId,
			value: triggerStates.value,
		})
		.from(triggerStates)
		.innerJoin(workflows, eq(workflows.id, triggerStates.workflowId))
		.where(
			and(
				eq(triggerStates.provider, GMAIL_PROVIDER),
				eq(triggerStates.resourceKey, mailbox),
				eq(workflows.status, "active"),
			),
		);
	if (registrations.length === 0) {
		return;
	}
	const topic = getGmailConfig().topic;
	const attemptedCredentials = new Set<string>();
	let failure: unknown = new Error(
		"Republish the Gmail workflows to update their watch settings",
	);
	for (const registration of registrations) {
		if (
			!registration.credentialId ||
			attemptedCredentials.has(registration.credentialId)
		) {
			continue;
		}
		attemptedCredentials.add(registration.credentialId);
		const value = gmailStateSchema.safeParse(registration.value);
		if (!value.success || value.data.topic !== topic) {
			continue;
		}
		try {
			const token = await getGoogleAccessToken(
				registration.credentialId,
				registration.userId,
			);
			await ensureMailboxWatch(token, mailbox, topic);
			return;
		} catch (error) {
			failure = error;
		}
	}
	throw failure;
};

type TriggerTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const prepareGmailWorkflow = async (
	workflowId: string,
	userId: string,
	nodes: WorkflowNode[],
): Promise<TriggerSetup> => {
	const enabled = nodes.filter((node) => {
		return node.task === "trigger.gmail" && !node.settings?.disabled;
	});
	const prepared: {
		node: WorkflowNode;
		mailbox: string;
		labelId: string;
		historyId: string;
		expiresAt: number;
		topic: string;
	}[] = [];
	const profiles = new Map<
		string,
		{ token: string; profile: z.infer<typeof gmailProfileSchema> }
	>();
	const watches = new Map<string, number>();
	for (const node of enabled) {
		const parsed = gmailTriggerNodeSchema.parse(node);
		const topic = getGmailConfig().topic;
		if (!node.credentialId) {
			throw createHttpError.BadRequest(
				"Select a Google credential for every Gmail trigger",
			);
		}
		let account = profiles.get(node.credentialId);
		if (!account) {
			const token = await getGoogleAccessToken(node.credentialId, userId);
			account = {
				token,
				profile: gmailProfileSchema.parse(await gmailRequest(token, "profile")),
			};
			profiles.set(node.credentialId, account);
		}
		const labelId = parsed.parameters[0].value;
		await gmailRequest(account.token, `labels/${encodeURIComponent(labelId)}`);
		const mailbox = account.profile.emailAddress.toLowerCase();
		const expiresAt =
			watches.get(mailbox) ??
			(await ensureMailboxWatch(account.token, mailbox, topic));
		watches.set(mailbox, expiresAt);
		prepared.push({
			node,
			mailbox,
			labelId,
			historyId: account.profile.historyId,
			expiresAt,
			topic,
		});
	}
	const save = async (tx: TriggerTransaction) => {
		const previous = await tx
			.select()
			.from(triggerStates)
			.where(
				and(
					eq(triggerStates.provider, GMAIL_PROVIDER),
					eq(triggerStates.workflowId, workflowId),
				),
			)
			.for("update");
		const retained = new Map<string, typeof triggerStates.$inferSelect>();
		for (const state of previous) {
			const proposed = prepared.find((candidate) => {
				return candidate.node.id === state.triggerNodeId;
			});
			const saved = gmailStateSchema.safeParse(state.value);
			if (
				proposed &&
				saved.success &&
				state.resourceKey === proposed.mailbox &&
				saved.data.labelId === proposed.labelId &&
				saved.data.topic === proposed.topic
			) {
				retained.set(state.triggerNodeId, state);
			} else {
				await tx.delete(triggerStates).where(eq(triggerStates.id, state.id));
			}
		}
		for (const proposed of prepared) {
			const state = retained.get(proposed.node.id);
			const saved = state ? gmailStateSchema.parse(state.value) : undefined;
			const value: GmailState = saved
				? {
						...saved,
						expiresAt: Math.max(saved.expiresAt, proposed.expiresAt),
					}
				: {
						labelId: proposed.labelId,
						historyId: proposed.historyId,
						expiresAt: proposed.expiresAt,
						topic: proposed.topic,
					};
			if (state) {
				await tx
					.update(triggerStates)
					.set({ credentialId: proposed.node.credentialId })
					.where(eq(triggerStates.id, state.id));
				await saveGmailState(tx, state.id, value);
			} else {
				const [created] = await tx
					.insert(triggerStates)
					.values({
						provider: GMAIL_PROVIDER,
						resourceKey: proposed.mailbox,
						workflowId,
						triggerNodeId: proposed.node.id,
						credentialId: proposed.node.credentialId,
						value,
						updatedAt: new Date(),
					})
					.returning({ id: triggerStates.id });
				if (!created) {
					throw new Error("Could not save Gmail trigger registration");
				}
			}
		}
	};
	const afterPublish = async () => {
		const mailboxes = new Set(prepared.map((trigger) => trigger.mailbox));
		for (const mailbox of mailboxes) {
			await addIntegrationEvent({
				provider: GMAIL_PROVIDER,
				data: { mailbox },
			});
		}
	};
	return { save, afterPublish };
};

const readMatchingEmail = async (
	messageId: string,
	token: string,
	labelId: string,
	arrivalHistoryId: string,
	eventLabels?: string[],
) => {
	if (
		eventLabels &&
		(!eventLabels.includes(labelId) || eventLabels.includes("DRAFT"))
	) {
		return;
	}
	let message: GmailMessage;
	try {
		message = gmailMessageSchema.parse(
			await gmailRequest(
				token,
				`messages/${encodeURIComponent(messageId)}?format=full`,
			),
		);
	} catch (error) {
		if (error instanceof GmailApiError && error.status === 404) {
			return;
		}
		throw error;
	}
	const arrivalLabels =
		eventLabels ??
		(await getGmailArrivalLabels(message, token, arrivalHistoryId, labelId));
	if (!isMatchingGmailMessage(message, labelId, arrivalLabels)) {
		return;
	}
	return { id: message.id, data: await getGmailMessageOutput(message, token) };
};

const readGmailTrigger = async (id: string) => {
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
			and(eq(triggerStates.id, id), eq(triggerStates.provider, GMAIL_PROVIDER)),
		);
	if (!record) {
		return;
	}
	const { state, nodes, connections } = record;
	const node = nodes?.find((candidate) => {
		return (
			candidate.id === state.triggerNodeId &&
			candidate.task === "trigger.gmail" &&
			!candidate.settings?.disabled
		);
	});
	if (record.status !== "active" || !nodes || !connections || !node) {
		return;
	}
	if (!state.credentialId || node.credentialId !== state.credentialId) {
		throw new Error(
			"Reconnect the Google credential and republish this Gmail trigger",
		);
	}
	const value = gmailStateSchema.parse(state.value);
	if (value.topic !== getGmailConfig().topic) {
		throw new Error(
			"Republish the Gmail workflow after changing the Pub/Sub topic",
		);
	}
	return {
		state,
		credentialId: state.credentialId,
		userId: record.userId,
		nodes,
		connections,
		value,
	};
};

const syncGmailTrigger = async (id: string, notifiedHistoryId?: string) => {
	const record = await readGmailTrigger(id);
	if (!record) {
		return false;
	}
	const { state, nodes, connections, value } = record;
	if (
		!value.pageToken &&
		notifiedHistoryId &&
		BigInt(value.historyId) >= BigInt(notifiedHistoryId)
	) {
		return false;
	}
	const token = await getGoogleAccessToken(record.credentialId, record.userId);
	const params = new URLSearchParams({
		startHistoryId: value.historyId,
		historyTypes: "messageAdded",
		maxResults: "20",
	});
	if (value.pageToken) {
		params.set("pageToken", value.pageToken);
	}
	let page: z.infer<typeof gmailHistorySchema>;
	try {
		page = gmailHistorySchema.parse(
			await gmailRequest(token, `history?${params}`),
		);
	} catch (error) {
		if (
			error instanceof GmailApiError &&
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
					and(eq(triggerStates.id, id), eq(triggerStates.value, state.value)),
				);
			throw new Error(
				"Gmail page token expired; retry from the saved history position",
			);
		}
		if (error instanceof GmailApiError && error.status === 404) {
			throw new Error(
				"Gmail history expired. Unpublish and publish again to resume new emails; missed emails are not recovered.",
			);
		}
		throw error;
	}
	if (
		BigInt(page.historyId) < BigInt(value.historyId) ||
		(page.nextPageToken && page.nextPageToken === value.pageToken)
	) {
		throw new Error("Gmail history did not advance correctly");
	}
	const emails: { id: string; data: unknown }[] = [];
	const matchedMessageIds = new Set<string>();
	for (const entry of page.history) {
		for (const added of entry.messagesAdded || []) {
			if (matchedMessageIds.has(added.message.id)) {
				continue;
			}
			const email = await readMatchingEmail(
				added.message.id,
				token,
				value.labelId,
				entry.id,
				added.message.labelIds,
			);
			if (email) {
				matchedMessageIds.add(email.id);
				emails.push(email);
			}
		}
	}
	// Google calls finish before locking. Advance only after every matched job is accepted.
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
		if (workflow?.status !== "active") {
			return false;
		}
		const [current] = await tx
			.select({ id: triggerStates.id })
			.from(triggerStates)
			.innerJoin(snapshots, eq(snapshots.workflowId, triggerStates.workflowId))
			.where(
				and(
					eq(triggerStates.id, id),
					eq(triggerStates.value, state.value),
					eq(triggerStates.credentialId, record.credentialId),
					eq(snapshots.nodes, nodes),
					eq(snapshots.connections, connections),
				),
			)
			.for("update", { of: triggerStates });
		if (!current) {
			throw new Error(
				"Gmail trigger changed during processing; retry with its latest checkpoint",
			);
		}
		for (const email of emails) {
			const sourceId = `gmail:${state.resourceKey}:${email.id}`;
			const claim = await claimTriggerEvent(
				state.workflowId,
				state.triggerNodeId,
				sourceId,
			);
			if (!claim) {
				continue;
			}
			try {
				const jobId = createHash("sha256")
					.update(
						JSON.stringify([state.workflowId, state.triggerNodeId, sourceId]),
					)
					.digest("hex");
				await addWorkflowInQueue(
					{
						executionId: randomUUID(),
						workflowId: state.workflowId,
						userId: record.userId,
						triggerNodeId: state.triggerNodeId,
						triggerType: "webhook",
						triggerData: email.data,
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
		await saveGmailState(tx, id, {
			...value,
			historyId: page.nextPageToken ? value.historyId : page.historyId,
			pageToken: page.nextPageToken,
		});
		return Boolean(page.nextPageToken);
	});
};

const notificationSchema = z.object({
	mailbox: z.email().transform((email) => {
		return email.toLowerCase();
	}),
	historyId: z.string().regex(/^\d+$/).optional(),
});

export const processGmailNotification = async (input: unknown) => {
	const notification = notificationSchema.parse(input);
	const registrations = await db
		.select({ id: triggerStates.id })
		.from(triggerStates)
		.innerJoin(workflows, eq(workflows.id, triggerStates.workflowId))
		.where(
			and(
				eq(triggerStates.provider, GMAIL_PROVIDER),
				eq(triggerStates.resourceKey, notification.mailbox),
				eq(workflows.status, "active"),
			),
		);
	const failures: unknown[] = [];
	for (const registration of registrations) {
		try {
			let hasMorePages = true;
			while (hasMorePages) {
				hasMorePages = await syncGmailTrigger(
					registration.id,
					notification.historyId,
				);
			}
		} catch (error) {
			console.error(
				"Gmail trigger processing failed",
				registration.id,
				error instanceof Error ? error.message : "Check the connected account",
			);
			failures.push(error);
		}
	}
	if (failures.length > 0) {
		throw new AggregateError(
			failures,
			"Some Gmail triggers could not be processed",
		);
	}
};

let renewingWatches = false;
const renewGmailWatches = async () => {
	if (renewingWatches) {
		return;
	}
	renewingWatches = true;
	try {
		const registrations = await db
			.selectDistinct({ mailbox: triggerStates.resourceKey })
			.from(triggerStates)
			.innerJoin(workflows, eq(workflows.id, triggerStates.workflowId))
			.where(
				and(
					eq(triggerStates.provider, GMAIL_PROVIDER),
					eq(workflows.status, "active"),
				),
			);
		for (const registration of registrations) {
			try {
				await renewGmailMailbox(registration.mailbox);
			} catch (error) {
				console.error(
					"Gmail watch renewal failed",
					error instanceof Error ? error.message : "Reconnect Google",
				);
			}
		}
	} finally {
		renewingWatches = false;
	}
};

export const startGmailWatchRenewal = () => {
	if (!process.env.GMAIL_PUBSUB_TOPIC) {
		return;
	}
	try {
		getGmailConfig();
	} catch {
		console.error(
			"Gmail Pub/Sub settings are incomplete; watch renewal is disabled",
		);
		return;
	}
	const renew = () => {
		renewGmailWatches().catch(() => {
			console.error("Could not renew Gmail watches");
		});
	};
	renew();
	return setInterval(renew, 86400000).unref();
};
