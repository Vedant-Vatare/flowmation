import type { JobsOptions } from "bullmq";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "../types/nodes.js";

export function nodeRetryOptions(
	retryCount = 0,
): Pick<JobsOptions, "attempts" | "backoff"> {
	if (!Number.isInteger(retryCount) || retryCount < 0 || retryCount > 3)
		throw new UnrecoverableError("Invalid node retry count");
	return {
		attempts: retryCount + 1,
		backoff: { type: "exponential", delay: 1000 },
	};
}

export function nodeFailure(result: NodeExecutorOutput): Error {
	const message = result.message || "Failed to execute node";
	return result.retryable === false
		? new UnrecoverableError(message)
		: new Error(message);
}

export function isFinalNodeFailure(
	error: unknown,
	attemptsMade: number,
	attempts = 1,
): boolean {
	return error instanceof UnrecoverableError || attemptsMade + 1 >= attempts;
}
