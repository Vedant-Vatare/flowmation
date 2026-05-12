import { redis } from "@nodebase/redis";

export const storeTestWebhook = async (
	webhookId: string,
	executionId: string,
) => {
	return await redis.set(`webhook:${webhookId}`, executionId, "EX", 60 * 5);
};

export const getTestWebhook = async (webhookId: string) => {
	return (await redis.getdel(`webhook:${webhookId}`)) ?? undefined;
};
