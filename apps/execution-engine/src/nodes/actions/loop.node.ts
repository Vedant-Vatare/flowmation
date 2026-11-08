import type { LoopState } from "@nodebase/queue";
import type { LoopNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";

export const getLoopItems = (value: unknown): unknown[] => {
	if (value === null || value === undefined) return [];
	if (Array.isArray(value)) return value;
	if (typeof value !== "string") return [value];
	const text = value.trim();
	if (!text) return [];
	try {
		const parsed: unknown = JSON.parse(text);
		if (Array.isArray(parsed)) return parsed;
	} catch {}
	return text.split(",").map((item) => item.trim());
};

export const loopNodeExecutor = async (
	_node: LoopNode,
	loopState?: LoopState,
): Promise<NodeExecutorOutput> => {
	try {
		if (!loopState) {
			return {
				success: false,
				message:
					"Loop state missing — this node should not be executed directly",
			};
		}

		if (loopState.done) {
			return {
				success: true,
				output: {
					_index: loopState._index,
					_items: loopState._items,
					done: true,
				},
				allowedOutputPorts: ["done"],
			};
		}

		const currentItem = loopState._items[loopState._index];

		return {
			success: true,
			output: {
				_index: loopState._index,
				iterationData: currentItem,
				_items: loopState._items,
				done: false,
			},
			allowedOutputPorts: ["loop"],
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Loop execution failed",
		};
	}
};
