import type { CsvNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";
import { runCsv } from "./csv.operations.js";

export const csvNodeExecutor = async (
	node: CsvNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		return {
			success: true,
			status: "completed",
			output: runCsv(
				params.operation?.value,
				params.input_data?.value,
				params.delimiter?.value ?? ",",
				params.header?.value,
				params.escape_formulas?.value,
			),
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "CSV failed",
		};
	}
};
