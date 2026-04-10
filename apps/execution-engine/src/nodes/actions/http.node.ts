import type { HttpNode, NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const httpNodeExecutor = async (
	node: HttpNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	const params = await getResolvedParams(node, executionId);
	const url = new URL(params.url.value);
	const method = params.method.value.toUpperCase();

	for (const [key, value] of Object.entries(params.urlParams.value)) {
		url.searchParams.set(key, value);
	}

	const headers = params.headers.value;

	const bodyMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
	const body =
		bodyMethods.has(method) && params.body.value
			? params.body.value
			: undefined;

	if (body && !headers["Content-Type"]) {
		headers["Content-Type"] = "application/json";
	}

	try {
		const response = await fetch(url.toString(), {
			method,
			headers,
			body,
		});

		const contentType = response.headers.get("Content-Type") ?? "";
		const data = contentType.includes("application/json")
			? await response.json()
			: await response.text();

		return {
			success: response.ok,
			message: `HTTP ${response.status} ${response.statusText}`,
			output: data,
		};
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "something went wrong when running node",
		};
	}
};
