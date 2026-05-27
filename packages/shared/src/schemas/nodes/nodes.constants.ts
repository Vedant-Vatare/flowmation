import type { z } from "zod";
import {
	httpNodeSchema,
	httpNodeValueSchemas,
	mergeDataNodeSchema,
	mergeDataNodeValueSchemas,
	waitingNodeSchema,
	waitingNodeValueSchemas,
} from "./action.nodes.js";
import { conditionalNodeSchema, conditionalNodeValueSchemas } from "./control.nodes.js";
import { aiNodeSchema, aiNodeValueSchemas } from "./integrations/ai.schema.js";
import { calcomNodeSchema, calcomNodeValueSchemas } from "./integrations/calcom.schema.js";
import { discordNodeSchema, discordNodeValueSchemas } from "./integrations/discord.schema.js";
import { gitHubNodeSchema, gitHubNodeValueSchemas } from "./integrations/github.schema.js";
import { googleDriveNodeSchema, googleDriveNodeValueSchemas } from "./integrations/google-drive.schema.js";
import { gmailNodeSchema, gmailNodeValueSchemas } from "./integrations/gmail.schema.js";
import { googleCalendarNodeSchema, googleCalendarNodeValueSchemas } from "./integrations/google-calendar.schema.js";
import { googleSheetsNodeSchema, googleSheetsNodeValueSchemas } from "./integrations/google-sheets.schema.js";
import { notionNodeSchema, notionNodeValueSchemas } from "./integrations/notion.schema.js";
import {
	razorpayNodeSchema,
	razorpayNodeValueSchemas,
} from "./integrations/razorpay.schema.js";
import { slackNodeSchema, slackNodeValueSchemas } from "./integrations/slack.schema.js";
import { telegramNodeSchema, telegramNodeValueSchemas } from "./integrations/telegram.schema.js";
import { setVariableNodeSchema, setVariableNodeValueSchemas } from "./transform.nodes.js";
import {
	clickNodeSchema,
	cronJobNodeSchema,
	cronJobNodeValueSchemas,
	inputNodeSchema,
	inputNodeValueSchemas,
	webhookNodeSchema,
} from "./trigger.nodes.js";

export const nodeSchemaRegistry = new Map<string, z.ZodObject>([
	["trigger.click", clickNodeSchema],
	["trigger.input", inputNodeSchema],
	["action.http", httpNodeSchema],
	["action.wait", waitingNodeSchema],
	["action.set_variable", setVariableNodeSchema],
	["trigger.cron", cronJobNodeSchema],
	["action.condition", conditionalNodeSchema],
	["action.merge", mergeDataNodeSchema],
	["trigger.webhook", webhookNodeSchema],
	["action.ai", aiNodeSchema],
	["action.calcom", calcomNodeSchema],
	["action.github", gitHubNodeSchema],
	["action.google_drive", googleDriveNodeSchema],
	["action.gmail", gmailNodeSchema],
	["action.google_calendar", googleCalendarNodeSchema],
	["action.google_sheets", googleSheetsNodeSchema],
	["action.discord", discordNodeSchema],
	["action.notion", notionNodeSchema],
	["action.razorpay", razorpayNodeSchema],
	["action.slack", slackNodeSchema],
	["action.telegram", telegramNodeSchema],
]);

export const nodeParamValueRegistry = new Map<string, Record<string, z.ZodType>>([
	["trigger.cron", cronJobNodeValueSchemas],
	["trigger.input", inputNodeValueSchemas],
	["action.http", httpNodeValueSchemas],
	["action.wait", waitingNodeValueSchemas],
	["action.set_variable", setVariableNodeValueSchemas],
	["action.condition", conditionalNodeValueSchemas],
	["action.merge", mergeDataNodeValueSchemas],
	["action.ai", aiNodeValueSchemas],
	["action.calcom", calcomNodeValueSchemas],
	["action.github", gitHubNodeValueSchemas],
	["action.google_drive", googleDriveNodeValueSchemas],
	["action.gmail", gmailNodeValueSchemas],
	["action.google_calendar", googleCalendarNodeValueSchemas],
	["action.google_sheets", googleSheetsNodeValueSchemas],
	["action.discord", discordNodeValueSchemas],
	["action.notion", notionNodeValueSchemas],
	["action.razorpay", razorpayNodeValueSchemas],
	["action.slack", slackNodeValueSchemas],
	["action.telegram", telegramNodeValueSchemas],
]);
