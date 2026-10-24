import type { WorkflowNode } from "@nodebase/shared";
import { toast } from "sonner";
import { NODE_UI_REGISTRY } from "@/constants/nodes";
import { useExecuteWorkflow } from "@/queries/userWorkflows";
import { useRegisterTestWebhook } from "@/queries/webhook";

export const useTestWorkflowExecution = () => {
	const { mutate: executeWorkflow, isPending } = useExecuteWorkflow();
	const { mutate: registerTestWebhook } = useRegisterTestWebhook();

	const executeTriggerNode = (nodeData: WorkflowNode) => {
		const mode = NODE_UI_REGISTRY[nodeData.task]?.triggerTestMode;
		if (nodeData.type !== "trigger" || !mode) return;
		if (mode === "external") {
			toast.info(
				"Publish this workflow, then send a new email to the connected Gmail account.",
			);
			return;
		}
		if (mode === "webhook") {
			registerTestWebhook(nodeData.id);
		} else {
			executeWorkflow({
				workflowId: nodeData.workflowId,
				triggerNodeId: nodeData.id,
				triggerType: "trigger",
			});
		}
	};

	return { executeTriggerNode, isPending };
};
