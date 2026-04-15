import type { ExecutionEventType, ExecutionUpdate } from "@nodebase/shared";
import { sseClients } from "@/services/sseServer.js";

export const broadcastExecutionUpdate = (
	jobData: {
		liveUpdates?: boolean;
		executionId: string;
	},
	executionUpdate: ExecutionUpdate,
) => {
	if (!jobData.liveUpdates) return null;
	const controller = sseClients.get(jobData.executionId);
	if (!controller) return;

	const eventType: ExecutionEventType = executionUpdate.type.startsWith(
		"workflow:",
	)
		? "workflow-update"
		: "node-update";

	controller.enqueue(
		`event: ${eventType}\n` + `data: ${JSON.stringify(executionUpdate)}\n\n`,
	);

	if (
		executionUpdate.type === "workflow:completed" ||
		executionUpdate.type === "workflow:failed"
	) {
		controller.close();
		sseClients.delete(jobData.executionId);
	}
};
