import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { ExecutionUpdate, NodeExecutionUpdate } from "@nodebase/shared";
import { useWorkflowExecutionStore } from "@/store/workflow/useWorkflowStore";

export const initiateSSEConnection = (
	executionId: string,
	maxTimeMs?: number,
) => {
	const addExecutionUpdate =
		useWorkflowExecutionStore.getState().addNodeExecutionUpdate;

	const controller = new AbortController();
	const URL = `${import.meta.env.VITE_SSE_SERVER_URL}/${executionId}`;

	if (maxTimeMs) setTimeout(() => controller.abort(), maxTimeMs);

	fetchEventSource(URL, {
		signal: controller.signal,
		openWhenHidden: true,
		headers: {
			Authorization: `bearer ${localStorage.getItem("token")}`,
		},

		async onopen(response: Response) {
			if (response.ok) {
				console.log("Connected to SSE server", response.status);
				return;
			}
			if (response.status === 404) {
				throw new Error("executionId not found");
			}
			throw new Error(`SSE open error: ${response.status}`);
		},

		onerror(error) {
			if (!maxTimeMs) throw error;
			return 2000;
		},

		async onmessage(msg) {
			try {
				const executionUpdate: ExecutionUpdate = JSON.parse(msg.data);

				if (executionUpdate.type.startsWith("node:")) {
					addExecutionUpdate(executionUpdate as NodeExecutionUpdate);
				}
				if (executionUpdate.type === "workflow:completed") {
					console.log("Workflow completed");
					controller.abort();
				}
				if (executionUpdate.type === "workflow:failed") {
					console.log("Workflow failed:", executionUpdate);
					controller.abort();
				}
			} catch (error) {
				console.error("Failed to parse SSE message:", error, msg.data);
			}
		},
	});

	return controller;
};
