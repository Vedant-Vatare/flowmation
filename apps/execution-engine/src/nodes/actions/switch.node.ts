import type { SwitchNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const casePorts = ["case_1", "case_2", "case_3"] as const;

export const switchNodeExecutor = async (
	node: SwitchNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	const params = await getResolvedParams(node, executionId);
	const input = params.input?.value;
	if (input === undefined) {
		return { success: false, message: "Switch input is missing" };
	}

	const matchedPort = casePorts.find((port) => {
		const value = params[port]?.value;
		return typeof value === "string" && value !== "" && value === input;
	});

	return {
		success: true,
		status: "completed",
		output: input,
		allowedOutputPorts: [matchedPort ?? "fallback"],
	};
};
