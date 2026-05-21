import type z from "zod";
import type { gitHubNodeSchema, gmailNodeSchema, notionNodeSchema } from "@/schemas/index.js";
import type { discordNodeSchema } from "@/schemas/nodes/integrations/discord.schema.js";

export type GmailNode = z.infer<typeof gmailNodeSchema>;
export type GitHubNode = z.infer<typeof gitHubNodeSchema>;
export type DiscordNode = z.infer<typeof discordNodeSchema>;
export type NotionNode = z.infer<typeof notionNodeSchema>;
