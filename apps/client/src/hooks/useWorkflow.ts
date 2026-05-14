import type { WorkflowNode } from "@nodebase/shared";
import { useExecuteWorkflow } from "@/queries/userWorkflows";
import { useRegisterTestWebhook } from "@/queries/webhook";

const getTriggerType = (task: string): "trigger" | "webhook" | "schedule" => {
	if (task.includes("webhook")) return "webhook";
	return "trigger";
};

export const useTestWorkflowExecution = () => {
	const { mutate: executeWorkflow, isPending } = useExecuteWorkflow();
	const { mutate: registerTestWebhook } = useRegisterTestWebhook();

	const executeTriggerNode = (nodeData: WorkflowNode) => {
		if (nodeData.task === "trigger.webhook") {
			registerTestWebhook(nodeData.id);
		} else {
			executeWorkflow({
				workflowId: nodeData.workflowId,
				triggerNodeId: nodeData.id,
				triggerType: getTriggerType(nodeData.task),
			});
		}
	};

	return { executeTriggerNode, isPending };
};
