import { and, db, desc, eq, inArray, nodeExecutionTable } from "@nodebase/db";
import {
	getWorkflowExecutionNodes,
	connection as redis,
} from "@nodebase/queue";
import type { ChainableCommander } from "ioredis";

async function executeCacheUpdate(update: ChainableCommander): Promise<void> {
	const results = await update.exec();
	if (!results) throw new Error("Execution cache update was not executed");
	for (const [error] of results) {
		if (error) throw error;
	}
}

async function recoverExecutionOutputs(
	executionId: string,
): Promise<Map<string, string>> {
	const nodes = await getWorkflowExecutionNodes(executionId);
	const namesById = new Map(nodes.map((node) => [node.id, node.name]));
	const rows = await db
		.selectDistinctOn([nodeExecutionTable.instanceId], {
			nodeId: nodeExecutionTable.instanceId,
			output: nodeExecutionTable.output,
		})
		.from(nodeExecutionTable)
		.where(
			and(
				eq(nodeExecutionTable.workflowExecutionId, executionId),
				inArray(nodeExecutionTable.instanceId, [...namesById.keys()]),
				inArray(nodeExecutionTable.status, ["success", "failed"]),
			),
		)
		.orderBy(
			nodeExecutionTable.instanceId,
			desc(nodeExecutionTable.executedAt),
			desc(nodeExecutionTable.completedAt),
			desc(nodeExecutionTable.id),
		);
	const outputs = new Map<string, string>();
	for (const row of rows) {
		const name = namesById.get(row.nodeId);
		if (name !== undefined) outputs.set(name, JSON.stringify(row.output));
	}
	if (outputs.size === 0) return outputs;

	const key = `exec:${executionId}`;
	try {
		const update = redis.pipeline();
		for (const [name, value] of outputs) update.hsetnx(key, name, value);
		update.expire(key, 3600, "NX").expire(key, 3600, "GT");
		await executeCacheUpdate(update);

		// Keep runtime values that are newer than the persisted outputs.
		const cached = await redis.hgetall(key);
		for (const [name, value] of Object.entries(cached))
			outputs.set(name, value);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown cache error";
		console.warn("Could not refill execution output cache:", message);
	}
	return outputs;
}

export const storeNodeOutput = async (
	executionId: string,
	nodeName: string,
	output: unknown,
) => {
	const key = `exec:${executionId}`;
	const update = redis
		.pipeline()
		.hset(key, nodeName, JSON.stringify(output))
		.expire(key, 3600, "NX")
		.expire(key, 3600, "GT");
	await executeCacheUpdate(update);
};

export const retainExecutionOutputsForWait = async (
	executionId: string,
	delayMs: number,
) => {
	const key = `exec:${executionId}`;
	const retentionSeconds = Math.ceil(delayMs / 1000) + 3600;
	const update = redis
		.pipeline()
		.expire(key, retentionSeconds, "NX")
		.expire(key, retentionSeconds, "GT");
	await executeCacheUpdate(update);
};

export const getNodeOutput = async (
	executionId: string,
	nodeName: string,
): Promise<unknown> => {
	let data = await redis.hget(`exec:${executionId}`, nodeName);
	if (data === null) {
		const outputs = await recoverExecutionOutputs(executionId);
		data = outputs.get(nodeName) ?? null;
	}
	return data ? JSON.parse(data) : null;
};

export const snapshotExecutionOutputs = (executionId: string) =>
	redis.hgetall(`exec:${executionId}`);

export const restoreExecutionOutputs = async (
	executionId: string,
	outputs: Record<string, string>,
) => {
	if (Object.keys(outputs).length === 0) return;

	const key = `exec:${executionId}`;
	await redis.hset(key, outputs);

	const update = redis
		.pipeline()
		.expire(key, 3600, "NX")
		.expire(key, 3600, "GT");

	await executeCacheUpdate(update);
};

export const getNodesOutputsByName = async (
	executionId: string,
	nodeNames: string[],
): Promise<(unknown | null)[]> => {
	if (nodeNames.length === 0) return [];
	const cached = await redis.hmget(`exec:${executionId}`, ...nodeNames);
	const recovered = cached.includes(null)
		? await recoverExecutionOutputs(executionId)
		: new Map<string, string>();
	return nodeNames.map((name, index) => {
		const data = cached[index] ?? recovered.get(name);
		return data ? JSON.parse(data) : null;
	});
};
