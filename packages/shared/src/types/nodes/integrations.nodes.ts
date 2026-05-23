import type z from "zod";
import type { gitHubNodeSchema, gmailNodeSchema, notionNodeSchema } from "@/schemas/index.js";
import type { discordNodeSchema } from "@/schemas/nodes/integrations/discord.schema.js";
import type { googleCalendarNodeSchema } from "@/schemas/nodes/integrations/google-calendar.schema.js";
import type { googleSheetsNodeSchema } from "@/schemas/nodes/integrations/google-sheets.schema.js";
import type { slackNodeSchema } from "@/schemas/nodes/integrations/slack.schema.js";

export type GoogleCalendarNode = z.infer<typeof googleCalendarNodeSchema>;
export type GoogleSheetsNode = z.infer<typeof googleSheetsNodeSchema>;
export type GmailNode = z.infer<typeof gmailNodeSchema>;
export type GitHubNode = z.infer<typeof gitHubNodeSchema>;
export type DiscordNode = z.infer<typeof discordNodeSchema>;
export type NotionNode = z.infer<typeof notionNodeSchema>;
export type SlackNode = z.infer<typeof slackNodeSchema>;
