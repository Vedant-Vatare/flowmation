import type { TextTransformNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

function uppercase(input: string): string {
	return input.toUpperCase();
}

function lowercase(input: string): string {
	return input.toLowerCase();
}

function trim(input: string): string {
	return input.trim();
}

function replace(input: string, value: string, replacement: string): string {
	return input.replaceAll(value, replacement);
}

function substring(input: string, start: number, end: number): string {
	return input.slice(start, end);
}

function concat(input: string, value: string): string {
	return input + value;
}

function split(input: string, delimiter: string): string[] {
	return input.split(delimiter);
}

function parseInputValue(value: unknown): unknown {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		// Try to convert JS object syntax to valid JSON: {key: "val"} → {"key": "val"}
		try {
			const fixed = value.replace(
				/([{,]\s*)(\w+)\s*:/g,
				'$1"$2":',
			);
			return JSON.parse(fixed);
		} catch {
			return value;
		}
	}
}

function template(input: string, templateStr: string): string {
	const parsed = parseInputValue(input);

	if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
		return templateStr.replace(/\{(\w+)\}/g, (match, key) => {
			if (key === "input") return input;
			const val = (parsed as Record<string, unknown>)[key];
			return val !== undefined ? String(val) : match;
		});
	}

	return templateStr.replace(/\{input\}/g, input);
}

function length(input: string): number {
	return input.length;
}

export const textTransformNodeExecutor = async (
	node: TextTransformNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation.value;
		const rawInput = params.input_text.value ?? "";
		const input = String(rawInput);

		let output: unknown;

		switch (operation) {
			case "uppercase":
				output = uppercase(input);
				break;
			case "lowercase":
				output = lowercase(input);
				break;
			case "trim":
				output = trim(input);
				break;
			case "replace":
				output = replace(
					input,
					String(params.value.value ?? ""),
					String(params.replacement.value ?? ""),
				);
				break;
			case "substring":
				output = substring(
					input,
					Number(params.start.value) || 0,
					Number(params.end.value) || input.length,
				);
				break;
			case "concat":
				output = concat(input, String(params.value.value ?? ""));
				break;
			case "split":
				output = split(input, String(params.delimiter.value ?? ","));
				break;
			case "template":
				output = template(String(rawInput), String(params.template.value ?? ""));
				break;
			case "length":
				output = length(input);
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
			message: error instanceof Error ? error.message : "Text Transform failed",
		};
	}
};
