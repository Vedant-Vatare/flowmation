import { redis } from "@/config/redis.js";

export const storeNodeOutput = async (
	executionId: string,
	nodeName: string,
	output: unknown,
) => {
	const key = `exec:${executionId}`;
	await redis.hset(key, nodeName, JSON.stringify(output));
	await redis.expire(key, 3600);
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
