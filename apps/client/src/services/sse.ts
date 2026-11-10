import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { ExecutionUpdate, NodeExecutionUpdate } from "@nodebase/shared";
import { toast } from "sonner";
import {
	useWebhookStore,
	useWorkflowExecutionStore,
} from "@/store/workflow/useWorkflowStore";

let activeConnection: AbortController | undefined;

const cleanupTestWebhookStatus = () => {
	const testWebhook = useWebhookStore.getState().testWebhook;
	const clearTestWebhook = useWebhookStore.getState().clearTestWebhook;

	if (testWebhook.isActive) clearTestWebhook();
};

export const initiateSSEConnection = (
	executionId: string,
	maxTimeMs?: number,
	onStart?: () => void,
) => {
	activeConnection?.abort();
	const controller = new AbortController();
	activeConnection = controller;
	const {
		addNodeExecutionUpdate,
		clearExecutionUpdates,
		setShowExecutionUpdates,
	} = useWorkflowExecutionStore.getState();
	clearExecutionUpdates();
	setShowExecutionUpdates(true);
	const URL = `${import.meta.env.VITE_SSE_SERVER_URL}/${executionId}`;

	const timeout = maxTimeMs
		? setTimeout(() => controller.abort(), maxTimeMs)
		: undefined;

	fetchEventSource(URL, {
		signal: controller.signal,
		openWhenHidden: true,
		credentials: "include",

		async onopen(response: Response) {
			if (controller.signal.aborted) return;
			if (response.ok) {
				console.log("Connected to SSE server", response.status);
				if (onStart) onStart();
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
			if (controller.signal.aborted) return;
			try {
				const executionUpdate: ExecutionUpdate = JSON.parse(msg.data);

				if (executionUpdate.type.startsWith("node:")) {
					addNodeExecutionUpdate(executionUpdate as NodeExecutionUpdate);
				}
				if (
					executionUpdate.type === "workflow:completed" ||
					executionUpdate.type === "workflow:cancelled"
				) {
					if (executionUpdate.type === "workflow:cancelled") {
						useWorkflowExecutionStore.getState().setRunCancelled();
					}
					console.log(executionUpdate.type);
					controller.abort();
					cleanupTestWebhookStatus();
				}
				if (executionUpdate.type === "workflow:failed") {
					console.log("Workflow failed:", executionUpdate);
					controller.abort();
					cleanupTestWebhookStatus();
				}
			} catch (error) {
				console.error("Failed to parse SSE message:", error, msg.data);
			}
		},
	})
		.catch((error: unknown) => {
			if (controller.signal.aborted) return;
			console.error("Could not connect to workflow updates:", error);
			cleanupTestWebhookStatus();
			toast.error(
				"Could not connect to live workflow updates. Check Runs for the execution result.",
			);
		})
		.finally(() => {
			clearTimeout(timeout);
			if (activeConnection === controller) activeConnection = undefined;
		});

	return controller;
};
