import { createHash, randomUUID } from "node:crypto";
import { redis } from "@nodebase/redis";
import createHttpError from "http-errors";

// A pending claim is not a successful delivery. Concurrent attempts must retry.
export const claimTriggerEvent = async (
	workflowId: string,
	triggerNodeId: string,
	eventId: string,
) => {
	const digest = createHash("sha256")
		.update(JSON.stringify([workflowId, triggerNodeId, eventId]))
		.digest("hex");
	const key = `http-trigger:event:${digest}`;
	const token = randomUUID();
	const claimed = await redis.set(key, token, "EX", 300, "NX");
	if (claimed) {
		return { key, token };
	}
	if ((await redis.get(key)) === "accepted") {
		return null;
	}
	throw createHttpError.ServiceUnavailable(
		"Trigger event is being accepted; retry the request",
	);
};

export const acceptTriggerEvent = async (claim: {
	key: string;
	token: string;
}) => {
	const accepted = await redis.eval(
		`if redis.call('GET', KEYS[1]) == ARGV[1] then
			return redis.call('SET', KEYS[1], 'accepted', 'EX', 86400)
		end
		return nil`,
		1,
		claim.key,
		claim.token,
	);
	if (!accepted) {
		throw createHttpError.ServiceUnavailable("Trigger event claim expired");
	}
};

export const releaseTriggerEvent = async (claim: {
	key: string;
	token: string;
}) => {
	await redis.eval(
		`if redis.call('GET', KEYS[1]) == ARGV[1] then
			return redis.call('DEL', KEYS[1])
		end
		return 0`,
		1,
		claim.key,
		claim.token,
	);
};
