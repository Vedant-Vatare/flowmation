import type { httpNodeSchema } from "@nodebase/shared";
import type z from "zod";

export type NodeExecutorOutput = {
	success: boolean;
	message?: string;
	output?: unknown;
};

export type HttpNode = z.infer<typeof httpNodeSchema>;
