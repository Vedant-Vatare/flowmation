import type { ArrayTransformNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

function resolveArray(value: unknown): unknown[] {
	if (Array.isArray(value)) return value;
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) return parsed;
		} catch {
			// not a valid JSON array
		}
	}
	return [value];
}

function mapArray(arr: unknown[], expression: string): unknown[] {
	return arr.map((item, index) => {
		try {
			const func = new Function("item", "index", `return ${expression}`);
			return func(item, index);
		} catch {
			return item;
		}
	});
}

function filterArray(arr: unknown[], expression: string): unknown[] {
	return arr.filter((item, index) => {
		try {
			const func = new Function("item", "index", `return !!(${expression})`);
			return func(item, index);
		} catch {
			return false;
		}
	});
}

function sortArray(arr: unknown[], direction: string): unknown[] {
	return [...arr].sort((a, b) => {
		const aVal =
			typeof a === "object" && a !== null ? JSON.stringify(a) : String(a);
		const bVal =
			typeof b === "object" && b !== null ? JSON.stringify(b) : String(b);
		if (aVal === bVal) return 0;
		const cmp = aVal < bVal ? -1 : 1;
		return direction === "desc" ? -cmp : cmp;
	});
}

function flattenArray(arr: unknown[]): unknown[] {
	return arr.flat();
}

function deduplicateArray(arr: unknown[]): unknown[] {
	const seen = new Set<string>();
	return arr.filter((item) => {
		const key = JSON.stringify(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function firstN(arr: unknown[], limit: number): unknown[] {
	return arr.slice(0, limit);
}

function lastN(arr: unknown[], limit: number): unknown[] {
	return arr.slice(-limit);
}

function sliceArray(arr: unknown[], start: number, limit: number): unknown[] {
	return arr.slice(start, start + limit);
}

function reverseArray(arr: unknown[]): unknown[] {
	return [...arr].reverse();
}

export const arrayTransformNodeExecutor = async (
	node: ArrayTransformNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation.value;
		const arr = resolveArray(params.input_array.value);

		let output: unknown;

		switch (operation) {
			case "map":
				output = mapArray(arr, String(params.expression.value ?? ""));
				break;
			case "filter":
				output = filterArray(arr, String(params.expression.value ?? ""));
				break;
			case "sort":
				output = sortArray(arr, (params.sort_direction?.value as string) ?? "asc");
				break;
			case "flatten":
				output = flattenArray(arr);
				break;
			case "deduplicate":
				output = deduplicateArray(arr);
				break;
			case "first":
				output = firstN(arr, Number(params.limit.value) || 1);
				break;
			case "last":
				output = lastN(arr, Number(params.limit.value) || 1);
				break;
			case "slice":
				output = sliceArray(
					arr,
					Number(params.start.value) || 0,
					Number(params.limit.value) || arr.length,
				);
				break;
			case "reverse":
				output = reverseArray(arr);
				break;
			default:
				return { success: false, message: `Unknown operation: ${operation}` };
		}

		return {
			success: true,
			output,
			status: "completed",
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Array Transform failed",
		};
	}
};
