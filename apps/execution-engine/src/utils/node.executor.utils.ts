import type { NodeExecutionConfig, NodeJobPayload } from "@nodebase/queue";
import {
	booleanValueSchema,
	finiteNumberValueSchema,
	getResolvedValueSchema,
	type NodeParameters,
	nodeParamValueRegistry,
	type WorkflowNode,
} from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import { FormatParamsValueExpressions } from "./resolve.params.expressions.js";
import { recordNodeCompletion } from "./workflow.updates.utils.js";

type KeyValueEntry = Record<string, string>;

type NodeParameterLike = Omit<NodeParameters, "value"> & {
	value?: unknown;
};
const preparedParameters = new WeakMap<object, NodeParameterLike[]>();

export const prepareNodeForExecution = async (
	node: WorkflowNode,
	executionId: string,
): Promise<WorkflowNode> => {
	const params = await getResolvedParams(node, executionId);
	const prepared = { ...node };
	preparedParameters.set(prepared, Object.values(params));
	return prepared;
};

export const getResolvedParams = async <T extends NodeParameterLike>(
	node: {
		task: string;
		name?: string;
		parameters: T[];
		settings: WorkflowNode["settings"];
	},
	executionId: string,
) => {
	// Upstream data that looks like an expression must not be evaluated a second time.
	const prepared = preparedParameters.get(node);
	if (prepared) return getTypedParams(prepared as T[]);
	const parameters = await FormatParamsValueExpressions(
		node.parameters,
		executionId,
	);
	validateResolvedParameters(node, parameters);
	// Values have now passed the runtime rules belonging to these parameter definitions.
	return getTypedParams(parameters as T[]);
};

function validateResolvedParameters(
	node: { task: string; name?: string },
	parameters: NodeParameterLike[],
): void {
	const schemas = nodeParamValueRegistry.get(node.task);
	if (!schemas) throw new UnrecoverableError(`Unknown node task: ${node.task}`);
	const byName = new Map(parameters.map((param) => [param.name, param]));
	const validated = new Set<string>();
	const visiting = new Set<string>();
	function fail(label: string, message: string): never {
		throw new UnrecoverableError(
			`${node.name ?? node.task}: ${label}: ${message}`,
		);
	}
	const validate = (name: string): void => {
		if (validated.has(name)) return;
		const param = byName.get(name);
		if (!param) return;
		if (visiting.has(name)) fail(param.label, "Circular parameter dependency");
		visiting.add(name);
		const active = (param.dependsOn ?? []).every((dependency) => {
			validate(dependency.parameter);
			const value = byName.get(dependency.parameter)?.value;
			return dependency.values.some(
				(expected) =>
					expected === value ||
					(typeof value === "boolean" && expected === String(value)) ||
					(typeof expected === "boolean" && value === String(expected)),
			);
		});
		const storedSchema = schemas[name];
		if (!storedSchema) fail(param.label, "Unknown parameter");
		const schema = getResolvedValueSchema(storedSchema);
		const empty =
			param.value === undefined || param.value === null || param.value === "";
		if (!active) {
			param.value = "";
		} else if (empty) {
			if (param.required && !schema.safeParse(undefined).success)
				fail(param.label, "A value is required after resolving expressions");
			if (param.value !== null || !schema.safeParse(null).success)
				param.value = "";
		} else {
			if (param.type === "number" || param.type === "boolean") {
				const primitiveSchema =
					param.type === "number"
						? finiteNumberValueSchema
						: booleanValueSchema;
				const primitive = primitiveSchema.safeParse(param.value);
				if (!primitive.success)
					fail(param.label, `Expected a valid ${param.type}`);
				param.value = primitive.data;
			}
			const result = schema.safeParse(param.value);
			if (!result.success)
				fail(param.label, result.error.issues[0]?.message ?? "Invalid value");
			param.value = result.data;
		}
		visiting.delete(name);
		validated.add(name);
	};
	for (const param of parameters) validate(param.name);
}

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
	params: NodeParameterLike[],
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

export const handlePreviousNodeExecution = async (jobData: NodeJobPayload) => {
	if (!jobData.previousNodeExecution) return;

	if (jobData.previousNodeExecution?.status === "waiting") {
		await recordNodeCompletion(
			{
				workflowId: jobData.workflowId,
				executionId: jobData.executionId,
				node: jobData.previousNodeExecution.node,
				nodeExecutionId: jobData.previousNodeExecution.id,
				liveUpdates: jobData.liveUpdates,
			},
			jobData.previousNodeExecution.output,
		);
	}
};
