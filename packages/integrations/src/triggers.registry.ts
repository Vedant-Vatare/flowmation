import type { db } from "@nodebase/db";
import type { WorkflowNode } from "@nodebase/shared";
import {
	prepareGmailWorkflow,
	startGmailWatchRenewal,
} from "./gmail/gmail-trigger.js";
import {
	prepareGoogleCalendarWorkflow,
	startGoogleCalendarWatchRenewal,
} from "./google-calendar/google-calendar-watch.js";

type TriggerTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TriggerSetup = {
	save: (tx: TriggerTransaction) => Promise<void>;
	afterPublish?: () => Promise<void>;
	rollback?: () => Promise<void>;
};

type TriggerHandler = {
	prepare?: (
		workflowId: string,
		userId: string,
		nodes: WorkflowNode[],
	) => Promise<TriggerSetup>;
	startRenewal?: () => ReturnType<typeof setInterval> | undefined;
};

export const triggerHandlers = new Map<string, TriggerHandler>([
	[
		"trigger.gmail",
		{ prepare: prepareGmailWorkflow, startRenewal: startGmailWatchRenewal },
	],
	[
		"trigger.google_calendar",
		{
			prepare: prepareGoogleCalendarWorkflow,
			startRenewal: startGoogleCalendarWatchRenewal,
		},
	],
]);

export const startTriggerWatchRenewals = () => {
	const starters = new Set(
		[...triggerHandlers.values()]
			.map((handler) => handler.startRenewal)
			.filter((start) => start !== undefined),
	);
	return [...starters].map((start) => start());
};
