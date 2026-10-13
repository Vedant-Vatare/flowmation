import type { WorkflowNode } from "@nodebase/shared";
import type { Request } from "express";

type TriggerRequest = Pick<Request, "method" | "headers" | "query"> & {
	rawBody: Uint8Array;
	body: unknown;
};

type TriggerContext = {
	workflowId: string;
	triggerNodeId: string;
	node: WorkflowNode;
	credential: Record<string, string> | null;
};

export type TriggerResponse = {
	status: number;
	headers?: Record<string, string>;
	body?: unknown;
};

type TriggerHandler = {
	verifyRequest: (
		request: TriggerRequest,
		context: TriggerContext,
	) => Promise<{ valid: true } | { valid: false; response: TriggerResponse }>;
	handleSetup?: (
		request: TriggerRequest,
		context: TriggerContext,
	) => Promise<TriggerResponse | null>;
	handleEvent: (
		request: TriggerRequest,
		context: TriggerContext,
	) => Promise<
		| { kind: "ignore"; response: TriggerResponse }
		| { kind: "trigger"; data: unknown; response: TriggerResponse }
	>;
};

export const httpTriggerHandlers = new Map<
	string,
	{
		credentialProvider?: string;
		triggerHandler: TriggerHandler;
	}
>();
