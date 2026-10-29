import { UnrecoverableError } from "bullmq";

export const NODE_TIMEOUT_MESSAGE = "Node execution timeout reached";
export const DEFAULT_NODE_TIMEOUT_MS = 30_000;

type TimedExecution<T> = {
	run: () => Promise<T>;
	timeoutMs: number;
	signal: AbortSignal;
	cancel: (reason: string) => void;
};

export async function runWithNodeTimeout<T>({
	run,
	timeoutMs,
	signal,
	cancel,
}: TimedExecution<T>): Promise<T> {
	if (!Number.isFinite(timeoutMs) || timeoutMs < 0)
		throw new UnrecoverableError("Invalid node execution timeout");

	const deadline = new AbortController();
	const executionSignal = AbortSignal.any([signal, deadline.signal]);

	return new Promise<T>((resolve, reject) => {
		let settled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const finish = (callback: () => void) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			executionSignal.removeEventListener("abort", abort);
			callback();
		};
		const abort = () =>
			finish(() =>
				reject(
					new UnrecoverableError(
						typeof executionSignal.reason === "string"
							? executionSignal.reason
							: "Node execution cancelled",
					),
				),
			);
		executionSignal.addEventListener("abort", abort, { once: true });

		if (executionSignal.aborted) {
			abort();
			return;
		}
		if (timeoutMs > 0) {
			timer = setTimeout(() => {
				deadline.abort(NODE_TIMEOUT_MESSAGE);

				try {
					cancel(NODE_TIMEOUT_MESSAGE);
				} catch {
					// The local signal has already cancelled this execution if queue cancellation fails.
				}
			}, timeoutMs);
		}

		Promise.resolve()
			.then(() => {
				executionSignal.throwIfAborted();

				return run();
			})
			.then(
				(value) => finish(() => resolve(value)),
				(error: unknown) => finish(() => reject(error)),
			);
	});
}
