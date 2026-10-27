import {
	processGmailNotification,
	processGoogleCalendarNotification,
} from "@nodebase/integrations";
import {
	createIntegrationEventWorker,
	type IntegrationEvent,
} from "@nodebase/queue";

const processIntegrationEvent = async (event: IntegrationEvent) => {
	switch (event.provider) {
		case "gmail": {
			await processGmailNotification(event.data);
			return;
		}
		case "google_calendar": {
			await processGoogleCalendarNotification(event.data);
			return;
		}
		default: {
			throw new Error(
				`Unsupported integration event provider: ${event.provider}`,
			);
		}
	}
};

let worker: ReturnType<typeof createIntegrationEventWorker> | undefined;
export const startIntegrationEventWorker = (): ReturnType<
	typeof createIntegrationEventWorker
> => {
	if (worker) {
		return worker;
	}
	worker = createIntegrationEventWorker(processIntegrationEvent);
	worker.on("error", (error) => {
		console.error("Integration event worker error", error.message);
	});
	worker.on("failed", (job, error) => {
		console.error(
			"Integration event failed",
			job?.id,
			job?.data.provider,
			error.message,
		);
	});
	return worker;
};
