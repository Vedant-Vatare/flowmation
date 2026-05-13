import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerTestWebhookApi } from "@/apis/webhook";
import { initiateSSEConnection } from "@/services/sse";
import {
	useWebhookStore,
	useWorkflowExecutionStore,
} from "@/store/workflow/useWorkflowStore";
import { getErrorMessage } from "@/utils/error";

export const useRegisterTestWebhook = () => {
	const setShowExecutionUpdates = useWorkflowExecutionStore(
		(s) => s.setShowExecutionUpdates,
	);
	const setTestWebhook = useWebhookStore((s) => s.setTestWebhook);

	return useMutation({
		mutationFn: registerTestWebhookApi,
		onSuccess: (executionId, webhookId) => {
			toast.success("Workflow execution started");
			initiateSSEConnection(executionId, 1000 * 60 * 2);
			setTestWebhook({ isActive: true, webhookId });
			setShowExecutionUpdates(true);
		},
		onError: (error) => {
			toast.error(getErrorMessage(error));
		},
	});
};
