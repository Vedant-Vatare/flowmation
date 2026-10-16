import type { XmlNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";
import { runXml } from "./xml.operations.js";

export const xmlNodeExecutor = async (
	node: XmlNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		return {
			success: true,
			status: "completed",
			output: runXml(
				params.operation?.value,
				params.input_data?.value,
				params.root_name?.value ?? "root",
			),
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "XML failed",
		};
	}
};
