import { createHash, randomUUID } from "node:crypto";
import { Queue, Worker } from "bullmq";
import { connection } from "./queue.js";

export const INTEGRATION_EVENT_QUEUE_NAME = "integration-events";
export type IntegrationEvent = { provider: string; data: unknown };
let eventQueue: Queue<IntegrationEvent> | undefined;

const getEventQueue = () => {
	if (!eventQueue) {
		const producer = connection.duplicate({
			maxRetriesPerRequest: 1,
			enableOfflineQueue: false,
			commandTimeout: 2000,
		});
		producer.on("error", () => {
			console.error("Integration event queue connection failed");
		});
		eventQueue = new Queue<IntegrationEvent>(INTEGRATION_EVENT_QUEUE_NAME, {
			connection: producer,
			defaultJobOptions: {
				attempts: 10,
				backoff: { type: "exponential", delay: 1000 },
				removeOnComplete: { age: 86400, count: 1000 },
				removeOnFail: { age: 7 * 86400, count: 500 },
			},
		});
	}
	return eventQueue;
};

export const addIntegrationEvent = async (
	event: IntegrationEvent,
	sourceEventId: string = randomUUID(),
) => {
	const jobId = createHash("sha256")
		.update(JSON.stringify([event.provider, sourceEventId]))
		.digest("hex");
	let timeout: ReturnType<typeof setTimeout> | undefined;
	try {
		const submission = (async () => {
			const job = await getEventQueue().add(event.provider, event, { jobId });
			if (await job.isFailed()) {
				await job.retry("failed", { resetAttemptsMade: true });
			}
			return job;
		})();
		return await Promise.race([
			submission,
			new Promise<never>((_, reject) => {
				timeout = setTimeout(() => {
					reject(new Error("Could not save the integration event in time"));
				}, 2000);
			}),
		]);
	} finally {
		clearTimeout(timeout);
	}
};

export const createIntegrationEventWorker = (
	handler: (event: IntegrationEvent) => Promise<void>,
) => {
	return new Worker<IntegrationEvent>(
		INTEGRATION_EVENT_QUEUE_NAME,
		async (job) => {
			await handler(job.data);
		},
		{ connection, concurrency: 5 },
	);
};
