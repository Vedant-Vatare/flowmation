import type { LoopState } from "@nodebase/queue";
import type { LoopNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";

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
				output: undefined,
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
