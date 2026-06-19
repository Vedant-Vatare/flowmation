import { connection as redis } from "@nodebase/queue";

export const storeNodeOutput = async (
	executionId: string,
	nodeName: string,
	output: unknown,
) => {
	const key = `exec:${executionId}`;
	await redis.pipeline().hset(key, nodeName, JSON.stringify(output)).expire(key, 3600).exec();
};

export const getNodeOutput = async (
	executionId: string,
	nodeName: string,
): Promise<unknown> => {
	const key = `exec:${executionId}`;
	const data = await redis.hget(key, nodeName);
	return data ? JSON.parse(data) : null;
};

export const getNodesOutputsByName = async (
	executionId: string,
	nodeNames: string[],
): Promise<(unknown | null)[]> => {
	const key = `exec:${executionId}`;
	const results = await redis.hmget(key, ...nodeNames);
	return results.map((data) => (data ? JSON.parse(data) : null));
};
