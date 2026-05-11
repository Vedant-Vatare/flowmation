import type z from "zod";
import type {
	clickNodeSchema,
	cronJobNodeSchema,
	inputNodeSchema,
	webhookNodeSchema,
} from "@/schemas/nodes/trigger.nodes.js";

export type ClickNode = z.infer<typeof clickNodeSchema>;
export type CronNode = z.infer<typeof cronJobNodeSchema>;
export type InputNode = z.infer<typeof inputNodeSchema>;
export type WebhookNode = z.infer<typeof webhookNodeSchema>;
