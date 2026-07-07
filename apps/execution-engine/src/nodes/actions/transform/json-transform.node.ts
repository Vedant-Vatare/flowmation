import type { JsonTransformNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

function getByPath(obj: unknown, path: string): unknown {
	const keys = path.split(".");
	let current: unknown = obj;

	for (const key of keys) {
		if (current === null || current === undefined) return undefined;
		current = (current as Record<string, unknown>)[key];
	}

	return current;
}

function renameObjectKeys(
	obj: Record<string, unknown>,
	mapping: Record<string, string>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(obj)) {
		result[mapping[key] ?? key] = val;
	}
	return result;
}

function extract(input: unknown, path: string): unknown {
	return getByPath(input, path);
}

function renameKeys(
	input: unknown,
	mapping: Record<string, string>,
): unknown {
	if (Array.isArray(input)) {
		return input.map((item) =>
			typeof item === "object" && item !== null
				? renameObjectKeys(item as Record<string, unknown>, mapping)
				: item,
		);
	}
	if (typeof input === "object" && input !== null) {
		return renameObjectKeys(input as Record<string, unknown>, mapping);
	}
	return input;
}

function pickKeys(input: unknown, keys: string[]): unknown {
	const keySet = new Set(keys);

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

function flatten(input: unknown, delimiter: string): unknown {
	function flattenObj(
		obj: Record<string, unknown>,
		prefix = "",
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(obj)) {
			const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
			if (typeof val === "object" && val !== null && !Array.isArray(val)) {
				Object.assign(result, flattenObj(val as Record<string, unknown>, newKey));
			} else {
				result[newKey] = val;
			}
		}
		return result;
	}

	if (Array.isArray(input)) {
		return input.map((item) =>
			typeof item === "object" && item !== null && !Array.isArray(item)
				? flattenObj(item as Record<string, unknown>)
				: item,
		);
	}
	if (typeof input === "object" && input !== null) {
		return flattenObj(input as Record<string, unknown>);
	}
	return input;
}

function nest(input: unknown): unknown {
	function nestObj(obj: Record<string, unknown>): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(obj)) {
			const parts = key.split(".");
			let current = result;
			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i]!;
				if (!(part in current)) current[part] = {};
				current = current[part] as Record<string, unknown>;
			}
			current[parts[parts.length - 1]!] = val;
		}
		return result;
	}

	if (typeof input === "object" && input !== null && !Array.isArray(input)) {
		return nestObj(input as Record<string, unknown>);
	}
	return input;
}

function parseInput(value: unknown): unknown {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

export const jsonTransformNodeExecutor = async (
	node: JsonTransformNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation.value;
		const input = parseInput(params.input_data.value);

		let output: unknown;

		switch (operation) {
			case "extract":
				output = extract(input, params.extract_path.value);
				break;
			case "rename_keys":
				output = renameKeys(input, params.keys_mapping.value as Record<string, string>);
				break;
			case "pick_keys":
				output = pickKeys(input, params.keys.value as string[]);
				break;
			case "omit_keys":
				output = omitKeys(input, params.keys.value as string[]);
				break;
			case "flatten":
				output = flatten(input, params.delimiter.value || ".");
				break;
			case "nest":
				output = nest(input);
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
			message: error instanceof Error ? error.message : "JSON Transform failed",
		};
	}
};
