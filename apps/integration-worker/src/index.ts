import { startTriggerWatchRenewals } from "@nodebase/integrations";
import { startIntegrationEventWorker } from "./integration-worker.js";

const worker = startIntegrationEventWorker();
const watchRenewalTimers = startTriggerWatchRenewals();

const shutdown = async () => {
	for (const timer of watchRenewalTimers) {
		if (timer) clearInterval(timer);
	}
	await worker.close();
};

let stopping = false;
const handleShutdown = () => {
	if (stopping) {
		return;
	}
	stopping = true;
	shutdown().then(
		() => {
			process.exit(0);
		},
		(error: unknown) => {
			console.error("Integration worker shutdown failed", error);
			process.exit(1);
		},
	);
};

process.once("SIGINT", handleShutdown);
process.once("SIGTERM", handleShutdown);
console.log("Integration worker started");
