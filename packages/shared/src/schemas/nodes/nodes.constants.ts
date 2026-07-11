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
import { clickupNodeSchema, clickupNodeValueSchemas } from "./integrations/clickup.schema.js";
import { discordNodeSchema, discordNodeValueSchemas } from "./integrations/discord.schema.js";
import { firebaseNodeSchema, firebaseNodeValueSchemas } from "./integrations/firebase.schema.js";
import { gitHubNodeSchema, gitHubNodeValueSchemas } from "./integrations/github.schema.js";
import { googleDriveNodeSchema, googleDriveNodeValueSchemas } from "./integrations/google-drive.schema.js";
import { gmailNodeSchema, gmailNodeValueSchemas } from "./integrations/gmail.schema.js";
import { googleCalendarNodeSchema, googleCalendarNodeValueSchemas } from "./integrations/google-calendar.schema.js";
import { googleDocsNodeSchema, googleDocsNodeValueSchemas } from "./integrations/google-docs.schema.js";
import { googleSheetsNodeSchema, googleSheetsNodeValueSchemas } from "./integrations/google-sheets.schema.js";
import { hubspotNodeSchema, hubspotNodeValueSchemas } from "./integrations/hubspot.schema.js";
import { jiraNodeSchema, jiraNodeValueSchemas } from "./integrations/jira.schema.js";
import { linearNodeSchema, linearNodeValueSchemas } from "./integrations/linear.schema.js";
import { notionNodeSchema, notionNodeValueSchemas } from "./integrations/notion.schema.js";
import { postgresNodeSchema, postgresNodeValueSchemas } from "./integrations/postgres.schema.js";
import { razorpayNodeSchema, razorpayNodeValueSchemas } from "./integrations/razorpay.schema.js";
import { sentryNodeSchema, sentryNodeValueSchemas } from "./integrations/sentry.schema.js";
import { slackNodeSchema, slackNodeValueSchemas } from "./integrations/slack.schema.js";
import { supabaseNodeSchema, supabaseNodeValueSchemas } from "./integrations/supabase.schema.js";
import { telegramNodeSchema, telegramNodeValueSchemas } from "./integrations/telegram.schema.js";
import { todoistNodeSchema, todoistNodeValueSchemas } from "./integrations/todoist.schema.js";
import { trelloNodeSchema, trelloNodeValueSchemas } from "./integrations/trello.schema.js";
import { twilioNodeSchema, twilioNodeValueSchemas } from "./integrations/twilio.schema.js";
import {
	arrayTransformNodeSchema,
	arrayTransformNodeValueSchemas,
	dateTimeNodeSchema,
	dateTimeNodeValueSchemas,
	filterNodeSchema,
	filterNodeValueSchemas,
	jsonTransformNodeSchema,
	jsonTransformNodeValueSchemas,
	numberTransformNodeSchema,
	numberTransformNodeValueSchemas,
	setVariableNodeSchema,
	setVariableNodeValueSchemas,
	textTransformNodeSchema,
	textTransformNodeValueSchemas,
} from "./transform/index.js";
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
	["action.json_transform", jsonTransformNodeSchema],
	["action.text_transform", textTransformNodeSchema],
	["action.number_transform", numberTransformNodeSchema],
	["action.array_transform", arrayTransformNodeSchema],
	["action.date_time", dateTimeNodeSchema],
	["action.filter", filterNodeSchema],
	["trigger.cron", cronJobNodeSchema],
	["action.condition", conditionalNodeSchema],
	["action.loop", loopNodeSchema],
	["action.merge", mergeDataNodeSchema],
	["trigger.webhook", webhookNodeSchema],
	["action.airtable", airtableNodeSchema],
	["action.ai", aiNodeSchema],
	["action.asana", asanaNodeSchema],
	["action.calcom", calcomNodeSchema],
	["action.clickup", clickupNodeSchema],
	["action.github", gitHubNodeSchema],
	["action.google_drive", googleDriveNodeSchema],
	["action.gmail", gmailNodeSchema],
["action.google_calendar", googleCalendarNodeSchema],
["action.google_docs", googleDocsNodeSchema],
["action.google_sheets", googleSheetsNodeSchema],
	["action.discord", discordNodeSchema],
	["action.firebase", firebaseNodeSchema],
	["action.hubspot", hubspotNodeSchema],
	["action.jira", jiraNodeSchema],
	["action.linear", linearNodeSchema],
	["action.notion", notionNodeSchema],
	["action.postgres", postgresNodeSchema],
	["action.razorpay", razorpayNodeSchema],
	["action.sentry", sentryNodeSchema],
	["action.slack", slackNodeSchema],
	["action.supabase", supabaseNodeSchema],
	["action.telegram", telegramNodeSchema],
	["action.todoist", todoistNodeSchema],
	["action.trello", trelloNodeSchema],
	["action.twilio", twilioNodeSchema],
]);

export const nodeParamValueRegistry = new Map<string, Record<string, z.ZodType>>([
	["trigger.cron", cronJobNodeValueSchemas],
	["trigger.input", inputNodeValueSchemas],
	["action.http", httpNodeValueSchemas],
	["action.wait", waitingNodeValueSchemas],
	["action.set_variable", setVariableNodeValueSchemas],
	["action.json_transform", jsonTransformNodeValueSchemas],
	["action.text_transform", textTransformNodeValueSchemas],
	["action.number_transform", numberTransformNodeValueSchemas],
	["action.array_transform", arrayTransformNodeValueSchemas],
	["action.date_time", dateTimeNodeValueSchemas],
	["action.filter", filterNodeValueSchemas],
	["action.condition", conditionalNodeValueSchemas],
	["action.loop", loopNodeValueSchemas],
	["action.merge", mergeDataNodeValueSchemas],
	["action.airtable", airtableNodeValueSchemas],
	["action.ai", aiNodeValueSchemas],
	["action.asana", asanaNodeValueSchemas],
	["action.calcom", calcomNodeValueSchemas],
	["action.clickup", clickupNodeValueSchemas],
	["action.github", gitHubNodeValueSchemas],
	["action.google_drive", googleDriveNodeValueSchemas],
	["action.gmail", gmailNodeValueSchemas],
["action.google_calendar", googleCalendarNodeValueSchemas],
["action.google_docs", googleDocsNodeValueSchemas],
["action.google_sheets", googleSheetsNodeValueSchemas],
	["action.discord", discordNodeValueSchemas],
	["action.firebase", firebaseNodeValueSchemas],
	["action.hubspot", hubspotNodeValueSchemas],
	["action.jira", jiraNodeValueSchemas],
	["action.linear", linearNodeValueSchemas],
	["action.notion", notionNodeValueSchemas],
	["action.postgres", postgresNodeValueSchemas],
	["action.razorpay", razorpayNodeValueSchemas],
	["action.sentry", sentryNodeValueSchemas],
	["action.slack", slackNodeValueSchemas],
	["action.supabase", supabaseNodeValueSchemas],
	["action.telegram", telegramNodeValueSchemas],
	["action.todoist", todoistNodeValueSchemas],
	["action.trello", trelloNodeValueSchemas],
	["action.twilio", twilioNodeValueSchemas],
]);
