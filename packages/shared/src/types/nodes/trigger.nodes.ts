import type z from "zod";
import type {
	clickNodeSchema,
	discordTriggerNodeSchema,
	inputNodeSchema,
	webhookNodeSchema,
} from "@/schemas/nodes/trigger.nodes.js";

export type ClickNode = z.infer<typeof clickNodeSchema>;
export type InputNode = z.infer<typeof inputNodeSchema>;
export type WebhookNode = z.infer<typeof webhookNodeSchema>;
export type DiscordTriggerNode = z.infer<typeof discordTriggerNodeSchema>;
