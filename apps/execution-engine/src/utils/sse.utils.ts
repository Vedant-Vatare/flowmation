import type { ExecutionEventType, ExecutionUpdate } from "@nodebase/shared";
import { eventBuffers, sseClients } from "@/services/sseServer.js";

export const broadcastExecutionUpdate = (
	jobData: {
		liveUpdates?: boolean;
		executionId: string;
	},
	executionUpdate: ExecutionUpdate,
) => {
	if (!jobData.liveUpdates) return null;

	const eventType: ExecutionEventType = executionUpdate.type.startsWith(
		"workflow:",
	)
		? "workflow-update"
		: "node-update";

	const update =
		`event: ${eventType}\n` + `data: ${JSON.stringify(executionUpdate)}\n\n`;

	const controller = sseClients.get(jobData.executionId);

	if (!controller) {
		const buf = eventBuffers.get(jobData.executionId) ?? [];
		buf.push(update);
		eventBuffers.set(jobData.executionId, buf);
		return;
	}

	controller.enqueue(update);

	if (
		executionUpdate.type === "workflow:completed" ||
		executionUpdate.type === "workflow:failed"
	) {
		controller.close();
		sseClients.delete(jobData.executionId);
	}
};
