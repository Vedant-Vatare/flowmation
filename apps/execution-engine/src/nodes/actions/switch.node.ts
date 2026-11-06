import type { SwitchNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const switchNodeExecutor = async (
	node: SwitchNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	const params = await getResolvedParams(node, executionId);
	const input = params.input?.value;
	if (input === undefined) {
		return { success: false, message: "Switch input is missing" };
	}

	if (!params.cases) {
		return { success: false, message: "Switch cases are missing" };
	}

	const matchedPort = params.cases.value.find(
		({ value }) => typeof value === "string" && value !== "" && value === input,
	)?.id;

	return {
		success: true,
		status: "completed",
		output: input,
		allowedOutputPorts: [matchedPort ?? "fallback"],
	};
};
