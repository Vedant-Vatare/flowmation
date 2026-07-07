import type { FilterNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

function isNullish(val: unknown): boolean {
	return val === null || val === undefined;
}

function isEmpty(val: unknown): boolean {
	if (isNullish(val)) return true;
	if (typeof val === "string") return val.length === 0;
	if (Array.isArray(val)) return val.length === 0;
	if (typeof val === "object" && val !== null) return Object.keys(val).length === 0;
	return false;
}

function parseInput(value: unknown): unknown {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function removeNulls(obj: unknown): unknown {
	if (Array.isArray(obj)) {
		return obj.filter((item) => !isNullish(item)).map(removeNulls);
	}
	if (typeof obj === "object" && obj !== null) {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
			if (!isNullish(val)) {
				result[key] = removeNulls(val);
			}
		}
		return result;
	}
	return obj;
}

function removeEmpty(obj: unknown): unknown {
	if (Array.isArray(obj)) {
		return obj.filter((item) => !isEmpty(item)).map(removeEmpty);
	}
	if (typeof obj === "object" && obj !== null) {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
			if (!isEmpty(val)) {
				result[key] = removeEmpty(val);
			}
		}
		return result;
	}
	return obj;
}

function pickKeys(input: unknown, keys: string[]): unknown {
	function pick(obj: Record<string, unknown>): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const key of keys) {
			if (key in obj) result[key] = obj[key];
		}
		return result;
	}

	if (Array.isArray(input)) {
		return input.map((item) =>
			typeof item === "object" && item !== null
				? pick(item as Record<string, unknown>)
				: item,
		);
	}
	if (typeof input === "object" && input !== null) {
		return pick(input as Record<string, unknown>);
	}
	return input;
}

function omitKeys(input: unknown, keys: string[]): unknown {
	const omitSet = new Set(keys);

	function omit(obj: Record<string, unknown>): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(obj)) {
			if (!omitSet.has(key)) result[key] = val;
		}
		return result;
	}

	if (Array.isArray(input)) {
		return input.map((item) =>
			typeof item === "object" && item !== null
				? omit(item as Record<string, unknown>)
				: item,
		);
	}
	if (typeof input === "object" && input !== null) {
		return omit(input as Record<string, unknown>);
	}
	return input;
}

function filterArray(input: unknown, condition: string): unknown {
	if (!Array.isArray(input)) return input;
	return input.filter((item, index) => {
		try {
			const func = new Function("item", "index", `return !!(${condition})`);
			return func(item, index);
		} catch {
			return false;
		}
	});
}

export const filterNodeExecutor = async (
	node: FilterNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation.value;
		const input = parseInput(params.input_data.value);

		let output: unknown;

		switch (operation) {
			case "remove_nulls":
				output = removeNulls(input);
				break;
			case "remove_empty":
				output = removeEmpty(input);
				break;
			case "pick_keys":
				output = pickKeys(input, params.keys.value as string[]);
				break;
			case "omit_keys":
				output = omitKeys(input, params.keys.value as string[]);
				break;
			case "filter_array":
				output = filterArray(input, String(params.condition.value ?? ""));
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
			message: error instanceof Error ? error.message : "Filter failed",
		};
	}
};
