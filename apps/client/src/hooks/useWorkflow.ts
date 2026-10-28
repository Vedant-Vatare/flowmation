import type { WorkflowNode } from "@nodebase/shared";
import { toast } from "sonner";
import { NODE_UI_REGISTRY } from "@/constants/nodes";
import { useExecuteWorkflow } from "@/queries/userWorkflows";
import { useRegisterTestWebhook } from "@/queries/webhook";

export const useTestWorkflowExecution = () => {
	const { mutate: executeWorkflow, isPending } = useExecuteWorkflow();
	const { mutate: registerTestWebhook } = useRegisterTestWebhook();

	const executeTriggerNode = (nodeData: WorkflowNode) => {
		const ui = NODE_UI_REGISTRY[nodeData.task];
		const mode = ui?.triggerTestMode;
		if (nodeData.type !== "trigger" || !mode) return;
		if (mode === "external") {
			toast.info(
				ui.triggerTestMessage ??
					"Publish this workflow, then send an event that matches your trigger settings.",
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
