import type { NodeParameters, NodePropertyType } from "@nodebase/shared";
import { getNodeOutput } from "@/services/executionStore.js";

const EXPRESSION_REGEX = /\{\{\s*([^}.]+?)(?:\.([^}]+?))?\s*\}\}/g;

export async function FormatParamsValueExpressions(
	params: NodeParameters[],
	executionId: string,
): Promise<NodeParameters[]> {
	return Promise.all(
		params.map(async (param) => ({
			...param,
			value: await resolveExpression(executionId, param.value, param.type),
		})),
	);
}

async function resolveExpression(
	executionId: string,
	value: unknown,
	type: NodePropertyType,
): Promise<unknown> {
	if (typeof value === "string") return resolveValue(executionId, value, type);

	if (Array.isArray(value))
		return Promise.all(
			value.map((v) => resolveExpression(executionId, v, type)),
		);

	if (value !== null && typeof value === "object") {
		const entries = await Promise.all(
			Object.entries(value).map(async ([k, v]) => [
				k,
				await resolveExpression(executionId, v, type),
			]),
		);
		return Object.fromEntries(entries);
	}

	return value;
}

async function resolveValue(
	executionId: string,
	str: string,
	type: NodePropertyType,
): Promise<unknown> {
	const matches = [...str.matchAll(EXPRESSION_REGEX)];

	if (matches.length === 0) return str;

	if (matches.length === 1 && matches[0]?.[0] === str.trim()) {
		const [, nodeName, path] = matches[0];
		if (!nodeName) return str;

		const output = await getNodeOutput(executionId, nodeName);
		const val = path ? getNestedValue(output, path) : output;

		return coerce(val, type);
	}

	let result = str;
	for (const match of matches) {
		const [full, nodeName, path] = match;
		if (!full || !nodeName) continue;

		const output = await getNodeOutput(executionId, nodeName);
		const val = path ? getNestedValue(output, path) : output;

		const stringified =
			val === undefined || val === null
				? ""
				: typeof val === "object"
					? JSON.stringify(val)
					: String(val);

		result = result.replace(full, stringified);
	}

	return result;
}

function coerce(val: unknown, type: NodePropertyType): unknown {
	if (type === "input") return val === undefined ? "" : String(val);
	if (type === "boolean") return Boolean(val);
	if (type === "number") return Number(val);
	return val;
}

function getNestedValue(obj: unknown, path: string): unknown {
	return path.split(".").reduce<unknown>((acc, key) => {
		if (acc === null || acc === undefined) return undefined;
		return (acc as Record<string, unknown>)[key];
	}, obj);
}
