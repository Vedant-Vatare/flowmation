import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerTestWebhookApi } from "@/apis/webhook";
import { initiateSSEConnection } from "@/services/sse";
import { useWebhookStore } from "@/store/workflow/useWorkflowStore";
import { getErrorMessage } from "@/utils/error";

export const useRegisterTestWebhook = () => {
	const setTestWebhook = useWebhookStore((s) => s.setTestWebhook);
	const clearTestWebhook = useWebhookStore((s) => s.clearTestWebhook);

	const onExecutionStart = () => {
		toast.success("Workflow execution started");
		clearTestWebhook();
	};

	return useMutation({
		mutationFn: registerTestWebhookApi,
		onSuccess: (executionId, webhookId) => {
			setTestWebhook({ isActive: true, webhookId });
			initiateSSEConnection(executionId, 1000 * 60 * 2, onExecutionStart);
		},
		onError: (error) => {
			toast.error(getErrorMessage(error));
		},
	});
};
