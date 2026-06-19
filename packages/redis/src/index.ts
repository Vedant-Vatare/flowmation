import { Redis } from "ioredis";

if (!process.env.REDIS_URL) {
	console.error("redis url is not set");
	process.exit(1);
}

export const redis = new Redis(process.env.REDIS_URL, {
	enableReadyCheck: false,
	lazyConnect: false,
});
