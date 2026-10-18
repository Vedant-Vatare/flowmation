import type z from "zod";
import type { gmailTriggerNodeSchema } from "@/schemas/nodes/gmail-trigger.schema.js";
import type {
	clickNodeSchema,
	discordTriggerNodeSchema,
	githubTriggerNodeSchema,
	inputNodeSchema,
	webhookNodeSchema,
} from "@/schemas/nodes/trigger.nodes.js";

export type ClickNode = z.infer<typeof clickNodeSchema>;
export type InputNode = z.infer<typeof inputNodeSchema>;
export type WebhookNode = z.infer<typeof webhookNodeSchema>;
export type DiscordTriggerNode = z.infer<typeof discordTriggerNodeSchema>;
export type GitHubTriggerNode = z.infer<typeof githubTriggerNodeSchema>;

export type GmailTriggerNode = z.infer<typeof gmailTriggerNodeSchema>;
