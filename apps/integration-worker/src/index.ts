import { startGmailWatchRenewal } from "@nodebase/integrations";
import { startIntegrationEventWorker } from "./integration-worker.js";

const worker = startIntegrationEventWorker();
const watchRenewalTimer = startGmailWatchRenewal();

const shutdown = async () => {
	if (watchRenewalTimer) {
		clearInterval(watchRenewalTimer);
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
