import type { NodeJobPayload } from "@nodebase/queue";
import type { InputNode } from "@nodebase/shared";
import { httpNodeExecutor } from "./nodes/actions/http.node.js";
import { waitNodeExecutor } from "./nodes/actions/wait.node.js";
import { inputNodeExecutor } from "./nodes/triggers/input.node.js";
import type { HttpNode, NodeExecutorOutput, WaitNode } from "./types/nodes.js";
import { checkRequiredParameters } from "./utils/node.executor.utils.js";

export const executeNode = ({
	workflowId,
	node,
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
			return httpNodeExecutor(node as HttpNode, workflowId);
		case "action.wait":
			return waitNodeExecutor(node as WaitNode, workflowId);
		case "trigger.input":
			return inputNodeExecutor(node as InputNode);
		default:
			return {
				success: false,
				message: `node with given task does not exist: ${node.task}`,
			};
	}
};
