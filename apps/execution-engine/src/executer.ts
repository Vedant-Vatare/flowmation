import type { NodeJobPayload, WorkflowJobPayload } from "@nodebase/queue";
import type { InputNode, WorkflowNode } from "@nodebase/shared";
import type { Job } from "bullmq";
import { conditionNodeExecutor } from "./nodes/actions/condition.node.js";
import { httpNodeExecutor } from "./nodes/actions/http.node.js";
import { mergeNodeExecutor } from "./nodes/actions/merge.node.js";
import { waitNodeExecutor } from "./nodes/actions/wait.node.js";
import { inputNodeExecutor } from "./nodes/triggers/input.node.js";
import { scheduleNodeExecutor } from "./nodes/triggers/schedule.node.js";
import type {
	ConditionNode,
	CronNode,
	HttpNode,
	MergeNode,
	NodeExecutorOutput,
	TriggerNodeExecutorOutput,
	WaitNode,
} from "./types/nodes.js";
import { checkRequiredParameters } from "./utils/node.executor.utils.js";

export const executeNode = ({
	executionId,
	node,
	nodeData,
}: NodeJobPayload): Promise<NodeExecutorOutput> | NodeExecutorOutput => {
	const { valid, missing } = checkRequiredParameters(node.parameters);

	if (!valid) {
		return {
			success: false,
			message: `Missing required parameters: ${missing.join(", ")}`,
		};
	}
	switch (node.task) {
		case "action.http":
			return httpNodeExecutor(node as HttpNode, executionId);
		case "action.wait":
			return waitNodeExecutor(node as WaitNode, executionId);
		case "action.condition":
			return conditionNodeExecutor(node as ConditionNode, executionId);
		case "action.merge":
			return mergeNodeExecutor(
				node as MergeNode,
				executionId,
				nodeData?.inputNodeNames,
			);
		default:
			return {
				success: false,
				message: `node with given task does not exist: ${node.task}`,
			};
	}
};

export const executeTriggerNode = async (
	triggerNode: WorkflowNode,
	job: Job<WorkflowJobPayload>,
): Promise<TriggerNodeExecutorOutput> => {
	const { valid, missing } = checkRequiredParameters(triggerNode.parameters);

	if (!valid) {
		return {
			success: false,
			skipCurrentExecution: true,
			message: `Missing required parameters: ${missing.join(", ")}`,
		};
	}
	switch (triggerNode.task) {
		case "trigger.cron":
			return scheduleNodeExecutor(triggerNode as CronNode, job);
		case "trigger.click":
			return { success: true };
		case "trigger.input":
			return inputNodeExecutor(triggerNode as InputNode);
		default:
			return {
				success: false,
				skipCurrentExecution: true,
				message: `trigger node with given task does not exist: ${triggerNode.task}`,
			};
	}
};
