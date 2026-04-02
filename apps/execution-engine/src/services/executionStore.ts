import { redis } from "@/config/redis.js";

export const storeNodeOutput = async (
	executionId: string,
	nodeName: string,
	output: unknown,
) => {
	const key = `exec:${executionId}:${nodeName}`;

	await redis.hset(key, nodeName, JSON.stringify(output));
	await redis.expire(key, 3600);
};

export const getNodeOutput = async (
	executionId: string,
	nodeName: string,
): Promise<unknown> => {
	const key = `exec:${executionId}:${nodeName}`;

	const data = await redis.hget(key, nodeName);

	return data ? JSON.parse(data) : null;
};
