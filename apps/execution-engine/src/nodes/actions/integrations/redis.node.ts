import {
	jsonObjectValueSchema,
	type RedisNode,
	stringListValueSchema,
} from "@nodebase/shared";
import type { DecryptedCredential, NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const redisNodeExecutor = async (
	node: RedisNode,
	executionId: string,
	credential: DecryptedCredential,
): Promise<NodeExecutorOutput> => {
	try {
		if (
			credential.type !== "database" ||
			!credential.fields?.connectionString
		) {
			return { success: false, message: "Invalid credential format for Redis" };
		}

		const connectionString = credential.fields.connectionString;
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation) return { success: false, message: "Operation is required" };
		const rawValue = params.value?.value;
		const keyType = params.keyType?.value || "automatic";
		const value =
			typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
		const hash =
			operation === "set" && keyType === "hash"
				? jsonObjectValueSchema.parse(rawValue)
				: undefined;
		const members =
			operation === "set" && keyType === "sets"
				? stringListValueSchema.parse(rawValue)
				: undefined;

		const { Redis } = await import("ioredis");
		const redis = new Redis(connectionString);

		try {
			let result: unknown;

			switch (operation) {
				case "get": {
					const key = params.key?.value as string;
					if (!key) return { success: false, message: "Key is required" };

					if (keyType === "automatic") {
						const type = await redis.type(key);
						if (type === "none") {
							result = null;
						} else if (type === "hash") {
							result = await redis.hgetall(key);
						} else if (type === "list") {
							result = await redis.lrange(key, 0, -1);
						} else if (type === "set") {
							result = await redis.smembers(key);
						} else {
							result = await redis.get(key);
						}
					} else if (keyType === "hash") {
						result = await redis.hgetall(key);
					} else if (keyType === "list") {
						result = await redis.lrange(key, 0, -1);
					} else if (keyType === "sets") {
						result = await redis.smembers(key);
					} else {
						result = await redis.get(key);
					}
					break;
				}

				case "set": {
					const key = params.key?.value as string;
					const expire = params.expire?.value === true;
					const ttl = params.ttl?.value;

					if (!key) return { success: false, message: "Key is required" };

					if (keyType === "hash") {
						if (hash) await redis.hset(key, hash);
					} else if (keyType === "list") {
						await redis.rpush(key, value ?? "");
					} else if (keyType === "sets") {
						if (members?.length) await redis.sadd(key, ...members);
					} else {
						await redis.set(key, value ?? "");
					}

					if (expire && ttl) {
						const ttlNum = Number(ttl);
						if (ttlNum > 0) await redis.expire(key, ttlNum);
					}

					result = { key, stored: true };
					break;
				}

				case "delete": {
					const key = params.key?.value as string;
					if (!key) return { success: false, message: "Key is required" };
					await redis.del(key);
					result = { deleted: true };
					break;
				}

				case "keys": {
					const pattern = params.pattern?.value as string;
					const getValues = params.getValues?.value !== false;
					if (!pattern)
						return { success: false, message: "Key pattern is required" };

					const keys = await redis.keys(pattern);

					if (!getValues) {
						result = { keys };
					} else {
						const data: Record<string, unknown> = {};
						for (const k of keys) {
							const type = await redis.type(k);
							if (type === "hash") {
								data[k] = await redis.hgetall(k);
							} else if (type === "list") {
								data[k] = await redis.lrange(k, 0, -1);
							} else if (type === "set") {
								data[k] = await redis.smembers(k);
							} else {
								data[k] = await redis.get(k);
							}
						}
						result = data;
					}
					break;
				}

				case "incr": {
					const key = params.key?.value as string;
					const expire = params.expire?.value === true;
					const ttl = params.ttl?.value;

					if (!key) return { success: false, message: "Key is required" };

					const newVal = await redis.incr(key);

					if (expire && ttl) {
						const ttlNum = Number(ttl);
						if (ttlNum > 0) await redis.expire(key, ttlNum);
					}

					result = { [key]: newVal };
					break;
				}

				case "info": {
					const info = await redis.info();
					const lines = info.split("\r\n").filter(Boolean);
					const parsed: Record<string, string> = {};
					for (const line of lines) {
						if (line.includes(":")) {
							const [k, ...rest] = line.split(":");
							if (k) parsed[k] = rest.join(":");
						}
					}
					result = parsed;
					break;
				}

				case "push": {
					const key = params.key?.value as string;
					const tail = params.tail?.value === true;

					if (!key) return { success: false, message: "Key is required" };
					if (!value) return { success: false, message: "Data is required" };

					if (tail) {
						await redis.rpush(key, value);
					} else {
						await redis.lpush(key, value);
					}

					const length = await redis.llen(key);
					result = { [key]: length };
					break;
				}

				case "pop": {
					const key = params.key?.value as string;
					const tail = params.tail?.value === true;

					if (!key) return { success: false, message: "Key is required" };

					let value: string | null;
					if (tail) {
						value = await redis.rpop(key);
					} else {
						value = await redis.lpop(key);
					}

					let output: unknown = value;
					if (value) {
						try {
							output = JSON.parse(value);
						} catch {
							output = value;
						}
					}

					result = output;
					break;
				}

				case "llen": {
					const key = params.key?.value as string;
					if (!key) return { success: false, message: "Key is required" };

					const length = await redis.llen(key);
					result = { [key]: length };
					break;
				}

				case "publish": {
					const channel = params.channel?.value as string;
					const data = params.data?.value as string;

					if (!channel)
						return { success: false, message: "Channel is required" };
					if (!data) return { success: false, message: "Data is required" };

					const receivers = await redis.publish(channel, data);
					result = { receivers };
					break;
				}

				default:
					return {
						success: false,
						message: `Unsupported operation: ${operation}`,
					};
			}

			return { success: true, output: result, status: "completed" };
		} finally {
			await redis.quit();
		}
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Redis node",
		};
	}
};
