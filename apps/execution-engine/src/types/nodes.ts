import type { httpNodeSchema, waitingNodeSchema } from "@nodebase/shared";
import type z from "zod";

export type NodeExecutorOutput = {
	success: boolean;
	message?: string;
	output?: unknown;
	status?: "completed" | "waiting" | "stopped";
};

export type HttpNode = z.infer<typeof httpNodeSchema>;
export type WaitNode = z.infer<typeof waitingNodeSchema>;
