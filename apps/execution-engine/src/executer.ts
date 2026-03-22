import type { WorkflowNode } from "@nodebase/shared";
import { httpNodeExecutor } from "./nodes/actions/http.node.js";
import type { HttpNode, NodeExecutorOutput } from "./types/nodes.js";
import { checkRequiredParameters } from "./utils/node.executor.utils.js";

export const executeNode = (
	node: WorkflowNode,
): Promise<NodeExecutorOutput> | NodeExecutorOutput => {
	const { valid, missing } = checkRequiredParameters(node.parameters);
	console.log(valid, missing);

	if (!valid) {
		return {
			success: false,
			message: `Missing required parameters: ${missing.join(", ")}`,
		};
	}

	switch (node.task) {
		case "action.http":
			return httpNodeExecutor(node as HttpNode);
		default:
			return {
				success: false,
				message: `node with given task does not exist: ${node.task}`,
			};
	}
};
