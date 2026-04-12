import type { NodeParameters } from "@nodebase/shared";
import { getNodesOutputsByName } from "@/services/executionStore.js";
import type { MergeNode, NodeExecutorOutput } from "@/types/nodes.js";

type MergeMode = "combine" | "append";

export const mergeNodeExecutor = async (
	node: MergeNode,
	executionId: string,
	upstreamNodeNames: string[] | undefined,
): Promise<NodeExecutorOutput> => {
	try {
		if (!upstreamNodeNames || upstreamNodeNames.length === 0) {
			return {
				success: false,
				message: "No upstream nodes connected",
			};
		}

		const mode = getMergeMode(node.parameters);
		const outputs = await getNodesOutputsByName(executionId, upstreamNodeNames);

		if (!outputs || outputs.length === 0) {
			return {
				success: false,
				message: "Failed to fetch upstream outputs",
			};
		}

		const merged =
			mode === "append"
				? appendMode(outputs)
				: combineMode(outputs, upstreamNodeNames);

		return {
			success: true,
			output: merged,
			status: "completed",
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Merge failed",
		};
	}
};

const getMergeMode = (parameters: NodeParameters[]): MergeMode => {
	const modeParam = parameters.find((p) => p.name === "mode");
	return (modeParam?.value as MergeMode) ?? "combine";
};

const appendMode = (outputs: unknown[]): unknown => {
	const result: unknown[] = [];

	outputs.forEach((output) => {
		if (output === null) return;

		if (Array.isArray(output)) {
			result.push(...output);
		} else {
			result.push(output);
		}
	});

	return result.length > 0 ? result : null;
};

const combineMode = (outputs: unknown[], nodeNames: string[]): unknown => {
	const result: Record<string, unknown> = {};

	outputs.forEach((output, index) => {
		if (output === null) return;

		if (typeof output === "object" && !Array.isArray(output)) {
			Object.assign(result, output);
		} else {
			const key = nodeNames[index] || `value_${index}`;
			result[key] = output;
		}
	});

	return Object.keys(result).length > 0 ? result : null;
};
