import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerTestWebhookApi } from "@/apis/webhook";
import { initiateSSEConnection } from "@/services/sse";
import { useWorkflowExecutionStore } from "@/store/workflow/useWorkflowStore";
import { getErrorMessage } from "@/utils/error";

export const useRegisterTestWebhook = () => {
	const setShowExecutionUpdates = useWorkflowExecutionStore(
		(s) => s.setShowExecutionUpdates,
	);

	return useMutation({
		mutationFn: registerTestWebhookApi,
		onSuccess: (executionId) => {
			toast.success("Workflow execution started");
			initiateSSEConnection(executionId);
			setShowExecutionUpdates(true);
		},
		onError: (error) => {
			toast.error(getErrorMessage(error));
		},
	});
};
