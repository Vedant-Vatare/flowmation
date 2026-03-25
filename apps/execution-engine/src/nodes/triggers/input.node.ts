import type { InputNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getTypedParams } from "@/utils/node.executor.utils.js";

export const inputNodeExecutor = async (
	node: InputNode,
): Promise<NodeExecutorOutput> => {
	const params = getTypedParams(node.parameters);

	return { success: true, output: params.inputs.value };
};
