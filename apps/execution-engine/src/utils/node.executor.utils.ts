import type { NodeExecutionConfig, PrevioudExecution } from "@nodebase/queue";
import type { NodeParameters, WorkflowNode } from "@nodebase/shared";
import { completeNodeExecutionQuery } from "@/queries/workflow.executions.js";
import { storeNodeOutput } from "@/services/executionStore.js";
import { FormatParamsValueExpressions } from "./resolve.params.expressions.js";

type KeyValueEntry = Record<string, string>;

export const getResolvedParams = async <T extends NodeParameters>(
	node: { parameters: T[]; config?: { hasExpressions?: boolean } },
	workflowId: string,
) => {
	const parameters = (
		node.config?.hasExpressions
			? await FormatParamsValueExpressions(node.parameters, workflowId)
			: node.parameters
	) as T[];

	return getTypedParams(parameters);
};

export const getTypedParams = <T extends { name: string }>(parameters: T[]) => {
	return Object.fromEntries(parameters.map((p) => [p.name, p])) as {
		[K in T["name"]]: Extract<T, { name: K }>;
	};
};

const isValidKeyValueEntry = (entry: KeyValueEntry): boolean => {
	return Object.entries(entry).every(
		([key, value]) => key !== "" && value !== "",
	);
};

export const checkKeyValueParam = (
	value: KeyValueEntry | KeyValueEntry[],
): boolean => {
	if (Array.isArray(value)) {
		return (
			value.length > 0 &&
			value.some((e) => Object.keys(e)[0] !== "") &&
			value.every(isValidKeyValueEntry)
		);
	}

	return isValidKeyValueEntry(value);
};

export const flattenKeyValueParam = (
	arr: Record<string, string>[],
): Record<string, string> =>
	arr.reduce(
		(acc, record) => {
			if ("key" in record && "value" in record) {
				if (record.key) acc[record.key] = record.value;
				return acc;
			}

			for (const [key, value] of Object.entries(record)) {
				if (key) acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string>,
	);

export const checkRequiredParameters = (
	params: NodeParameters[],
): { valid: boolean; missing: string[] } => {
	const missing: string[] = [];
	const valueMap = Object.fromEntries(params.map((p) => [p.name, p.value]));

	for (const p of params) {
		if (!p.required) continue;

		if (p.dependsOn?.length) {
			const isActive = p.dependsOn.every((condition) =>
				condition.values.includes(valueMap[condition.parameter] as string),
			);
			if (!isActive) continue;
		}

		if (p.value === undefined || p.value === null || p.value === "") {
			missing.push(p.label);
			continue;
		}

		if (p.type === "key-value") {
			if (!checkKeyValueParam(p.value as KeyValueEntry | KeyValueEntry[])) {
				missing.push(p.label);
			}
			continue;
		}

		if (Array.isArray(p.value) && p.value.length === 0) {
			missing.push(p.label);
		}
	}

	return { valid: missing.length === 0, missing };
};

export const nodeExecutionConfig = (
	node: WorkflowNode,
	previousNodeOutput: unknown,
): NodeExecutionConfig => {
	if (node.task === "action.wait") {
		if (
			typeof previousNodeOutput !== "object" ||
			previousNodeOutput === null ||
			!("delay" in previousNodeOutput)
		) {
			throw new Error("wait node did not provide delay");
		}

		const { delay } = previousNodeOutput as { delay: unknown };
		if (typeof delay !== "number") {
			throw new Error("wait node did not provide delay");
		}

		return { delay };
	}

	if (node.task === "action.schedule") {
		return { repeat: { pattern: "0 * * * *" } };
	}

	return {};
};

export const handlePreviousNodeExecution = async (
	previousExecution: PrevioudExecution,
	workflowId: string,
) => {
	if (!previousExecution) return;
	if (previousExecution?.status === "waiting") {
		await completeNodeExecutionQuery(
			previousExecution.id,
			previousExecution.output,
		);
		await storeNodeOutput(
			workflowId,
			previousExecution.nodeName,
			previousExecution.output,
		);
	}
};
