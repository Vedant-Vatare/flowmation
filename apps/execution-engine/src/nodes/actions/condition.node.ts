import type { ConditionNode, NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

function isSameType(a: unknown, b: unknown) {
	if (a === null || b === null) {
		return a === b;
	}

	if (Array.isArray(a) || Array.isArray(b)) {
		return Array.isArray(a) && Array.isArray(b);
	}

	return typeof a === typeof b;
}

function toSafeNumber(val: unknown): number | null {
	if (typeof val === "number") return val;

	if (typeof val === "string" && val.trim() !== "") {
		const n = Number(val);
		return Number.isNaN(n) ? null : n;
	}

	return null;
}

export const conditionNodeExecutor = async (
	node: ConditionNode,
	workflowId: string,
): Promise<NodeExecutorOutput & { output: boolean }> => {
	const params = await getResolvedParams(node, workflowId);
	const operator = params.operator.value;
	const leftValue = params.left_operand.value;
	const rightValue = params.right_operand.value;
	console.log({ leftValue, rightValue, operator });

	let success = true;
	let output = false;
	let message: string | undefined;

	if (operator === "eq") {
		if (!isSameType(leftValue, rightValue)) {
			output = false;
		} else {
			output = leftValue === rightValue;
		}
	} else if (operator === "neq") {
		if (!isSameType(leftValue, rightValue)) {
			output = true;
		} else {
			output = leftValue !== rightValue;
		}
	} else if (["gt", "lt", "gte", "lte"].includes(operator)) {
		if (!isSameType(leftValue, rightValue)) {
			output = false;
			message = `Type mismatch: cannot compare ${typeof leftValue} with ${typeof rightValue}`;
		} else {
			const l = toSafeNumber(leftValue);
			const r = toSafeNumber(rightValue);

			if (l === null || r === null) {
				output = false;
				message = `Non-numeric value: cannot use ${operator} on non-numeric operands`;
			} else if (operator === "gt") {
				output = l > r;
			} else if (operator === "lt") {
				output = l < r;
			} else if (operator === "gte") {
				output = l >= r;
			} else if (operator === "lte") {
				output = l <= r;
			}
		}
	} else if (operator === "con") {
		let data = leftValue;

		if (typeof data === "string") {
			try {
				data = JSON.parse(data);
			} catch {
				output = false;
			}
		}

		output =
			(Array.isArray(data) && data.includes(rightValue)) ||
			(data !== null &&
				typeof rightValue !== "boolean" &&
				typeof data === "object" &&
				Object.hasOwn(data, rightValue));
	} else if (operator === "emt") {
		if (leftValue == null) output = true;
		else if (typeof leftValue === "string") output = leftValue.length === 0;
		else if (Array.isArray(leftValue)) output = leftValue.length === 0;
		else if (typeof leftValue === "object")
			output = Object.keys(leftValue).length === 0;
	} else {
		success = false;
		message = "invalid operator";
	}

	return {
		success,
		output,
		...(message && { message }),
		allowedOutputPorts: [output ? "true" : "false"],
	};
};
