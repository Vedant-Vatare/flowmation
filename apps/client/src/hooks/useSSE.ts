import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { ExecutionUpdate, NodeExecutionUpdate } from "@nodebase/shared";
import { useWorkflowExecutionStore } from "@/store/workflow/useWorkflowStore";

export const useSSE = () => {
	const addExecutionUpdate = useWorkflowExecutionStore(
		(s) => s.addNodeExecutionUpdate,
	);

	const createSSEConnection = (executionId: string) => {
		fetchEventSource(`${import.meta.env.VITE_SSE_SERVER_URL}/${executionId}`, {
			headers: {
				Authorization: `bearer ${localStorage.getItem("token")}`,
			},
			async onopen(response: Response) {
				if (response.ok) {
					console.log("✓ Connected to SSE server", response.status);
				}
			},
			async onmessage(msg) {
				try {
					const executionUpdate: ExecutionUpdate = JSON.parse(msg.data);

					if (executionUpdate.type.startsWith("node:")) {
						const nodeUpdate = executionUpdate as NodeExecutionUpdate;
						addExecutionUpdate(nodeUpdate);
						console.log("Node update received:", nodeUpdate);
					}

					if (executionUpdate.type === "workflow:completed") {
						console.log("Workflow completed");
					}

					if (executionUpdate.type === "workflow:failed") {
						console.log("Workflow failed:", executionUpdate);
					}
				} catch (error) {
					console.error("Failed to parse SSE message:", error, msg.data);
				}
			},
			onerror(error) {
				console.error("SSE connection error:", error);

				return null;
			},
		});
	};

	return { createSSEConnection };
};
