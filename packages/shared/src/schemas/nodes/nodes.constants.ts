import type { z } from "zod";
import {
	httpNodeSchema,
	httpNodeValueSchemas,
	mergeDataNodeSchema,
	mergeDataNodeValueSchemas,
	waitingNodeSchema,
	waitingNodeValueSchemas,
} from "./action.nodes.js";
import { conditionalNodeSchema, conditionalNodeValueSchemas, loopNodeSchema, loopNodeValueSchemas } from "./control.nodes.js";
import { airtableNodeSchema, airtableNodeValueSchemas } from "./integrations/airtable.schema.js";
import { aiNodeSchema, aiNodeValueSchemas } from "./integrations/ai.schema.js";
import { asanaNodeSchema, asanaNodeValueSchemas } from "./integrations/asana.schema.js";
import { calcomNodeSchema, calcomNodeValueSchemas } from "./integrations/calcom.schema.js";
import { discordNodeSchema, discordNodeValueSchemas } from "./integrations/discord.schema.js";
import { gitHubNodeSchema, gitHubNodeValueSchemas } from "./integrations/github.schema.js";
import { googleDriveNodeSchema, googleDriveNodeValueSchemas } from "./integrations/google-drive.schema.js";
import { gmailNodeSchema, gmailNodeValueSchemas } from "./integrations/gmail.schema.js";
import { googleCalendarNodeSchema, googleCalendarNodeValueSchemas } from "./integrations/google-calendar.schema.js";
import { googleSheetsNodeSchema, googleSheetsNodeValueSchemas } from "./integrations/google-sheets.schema.js";
import { hubspotNodeSchema, hubspotNodeValueSchemas } from "./integrations/hubspot.schema.js";
import { jiraNodeSchema, jiraNodeValueSchemas } from "./integrations/jira.schema.js";
import { linearNodeSchema, linearNodeValueSchemas } from "./integrations/linear.schema.js";
import { notionNodeSchema, notionNodeValueSchemas } from "./integrations/notion.schema.js";
import { razorpayNodeSchema, razorpayNodeValueSchemas } from "./integrations/razorpay.schema.js";
import { sentryNodeSchema, sentryNodeValueSchemas } from "./integrations/sentry.schema.js";
import { slackNodeSchema, slackNodeValueSchemas } from "./integrations/slack.schema.js";
import { telegramNodeSchema, telegramNodeValueSchemas } from "./integrations/telegram.schema.js";
import { twilioNodeSchema, twilioNodeValueSchemas } from "./integrations/twilio.schema.js";
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
	["action.loop", loopNodeSchema],
	["action.merge", mergeDataNodeSchema],
	["trigger.webhook", webhookNodeSchema],
	["action.airtable", airtableNodeSchema],
	["action.ai", aiNodeSchema],
	["action.asana", asanaNodeSchema],
	["action.calcom", calcomNodeSchema],
	["action.github", gitHubNodeSchema],
	["action.google_drive", googleDriveNodeSchema],
	["action.gmail", gmailNodeSchema],
	["action.google_calendar", googleCalendarNodeSchema],
	["action.google_sheets", googleSheetsNodeSchema],
	["action.discord", discordNodeSchema],
	["action.hubspot", hubspotNodeSchema],
	["action.jira", jiraNodeSchema],
	["action.linear", linearNodeSchema],
	["action.notion", notionNodeSchema],
	["action.razorpay", razorpayNodeSchema],
	["action.sentry", sentryNodeSchema],
	["action.slack", slackNodeSchema],
	["action.telegram", telegramNodeSchema],
	["action.twilio", twilioNodeSchema],
]);

export const nodeParamValueRegistry = new Map<string, Record<string, z.ZodType>>([
	["trigger.cron", cronJobNodeValueSchemas],
	["trigger.input", inputNodeValueSchemas],
	["action.http", httpNodeValueSchemas],
	["action.wait", waitingNodeValueSchemas],
	["action.set_variable", setVariableNodeValueSchemas],
	["action.condition", conditionalNodeValueSchemas],
	["action.loop", loopNodeValueSchemas],
	["action.merge", mergeDataNodeValueSchemas],
	["action.airtable", airtableNodeValueSchemas],
	["action.ai", aiNodeValueSchemas],
	["action.asana", asanaNodeValueSchemas],
	["action.calcom", calcomNodeValueSchemas],
	["action.github", gitHubNodeValueSchemas],
	["action.google_drive", googleDriveNodeValueSchemas],
	["action.gmail", gmailNodeValueSchemas],
	["action.google_calendar", googleCalendarNodeValueSchemas],
	["action.google_sheets", googleSheetsNodeValueSchemas],
	["action.discord", discordNodeValueSchemas],
	["action.hubspot", hubspotNodeValueSchemas],
	["action.jira", jiraNodeValueSchemas],
	["action.linear", linearNodeValueSchemas],
	["action.notion", notionNodeValueSchemas],
	["action.razorpay", razorpayNodeValueSchemas],
	["action.sentry", sentryNodeValueSchemas],
	["action.slack", slackNodeValueSchemas],
	["action.telegram", telegramNodeValueSchemas],
	["action.twilio", twilioNodeValueSchemas],
]);
