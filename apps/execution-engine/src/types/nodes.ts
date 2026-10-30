import type { getDecryptedCredential } from "@nodebase/db";

export type DecryptedCredential = Awaited<
	ReturnType<typeof getDecryptedCredential>
>;

export type NodeExecutorOutput = {
	retryable?: boolean;
	success?: boolean;
	message?: string;
	output?: unknown;
	status?: "completed" | "waiting" | "stopped";
	allowedOutputPorts?: string[];
};

export type TriggerNodeExecutorOutput = NodeExecutorOutput & {
	// if current trigger node and workflow should be executed or not and be marked as executed
	skipCurrentExecution?: boolean;
};
