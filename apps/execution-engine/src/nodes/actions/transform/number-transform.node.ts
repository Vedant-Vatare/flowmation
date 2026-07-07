import type { NumberTransformNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

function toNumber(val: unknown): number {
	if (typeof val === "number") return val;
	if (typeof val === "string") {
		const n = Number(val);
		if (Number.isNaN(n)) throw new Error(`Cannot convert "${val}" to a number`);
		return n;
	}
	throw new Error(`Cannot convert ${typeof val} to a number`);
}

function add(a: number, b: number): number {
	return a + b;
}

function subtract(a: number, b: number): number {
	return a - b;
}

function multiply(a: number, b: number): number {
	return a * b;
}

function divide(a: number, b: number): number {
	if (b === 0) throw new Error("Division by zero");
	return a / b;
}

function modulo(a: number, b: number): number {
	if (b === 0) throw new Error("Modulo by zero");
	return a % b;
}

function round(a: number, precision: number): number {
	const factor = 10 ** precision;
	return Math.round(a * factor) / factor;
}

function floor(a: number): number {
	return Math.floor(a);
}

function ceil(a: number): number {
	return Math.ceil(a);
}

function min(a: number, b: number): number {
	return Math.min(a, b);
}

function max(a: number, b: number): number {
	return Math.max(a, b);
}

const binaryOps: Record<string, (a: number, b: number) => number> = {
	add,
	subtract,
	multiply,
	divide,
	modulo,
	min,
	max,
};

export const numberTransformNodeExecutor = async (
	node: NumberTransformNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation.value;
		const a = toNumber(params.operand_a.value);

		let output: number;

		if (binaryOps[operation]) {
			output = binaryOps[operation](a, toNumber(params.operand_b.value));
		} else if (operation === "round") {
			output = round(a, Number(params.precision.value) || 0);
		} else if (operation === "floor") {
			output = floor(a);
		} else if (operation === "ceil") {
			output = ceil(a);
		} else {
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
			message: error instanceof Error ? error.message : "Number Transform failed",
		};
	}
};
