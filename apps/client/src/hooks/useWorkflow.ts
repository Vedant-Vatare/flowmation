import type { WorkflowNode } from "@nodebase/shared";
import { NODE_UI_REGISTRY } from "@/constants/nodes";
import { useExecuteWorkflow } from "@/queries/userWorkflows";
import { useRegisterTestWebhook } from "@/queries/webhook";

export const useTestWorkflowExecution = () => {
	const { mutate: executeWorkflow, isPending } = useExecuteWorkflow();
	const { mutate: registerTestWebhook } = useRegisterTestWebhook();

	const executeTriggerNode = (nodeData: WorkflowNode) => {
		const mode = NODE_UI_REGISTRY[nodeData.task]?.triggerTestMode;
		if (nodeData.type !== "trigger" || !mode) return;
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
