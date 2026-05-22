import type z from "zod";
import {
	httpNodeSchema,
	mergeDataNodeSchema,
	waitingNodeSchema,
} from "./action.nodes.js";
import { conditionalNodeSchema } from "./control.nodes.js";
import { discordNodeSchema } from "./integrations/discord.schema.js";
import { gitHubNodeSchema } from "./integrations/github.schema.js";
import { gmailNodeSchema } from "./integrations/gmail.schema.js";
import { notionNodeSchema } from "./integrations/notion.schema.js";
import { slackNodeSchema } from "./integrations/slack.schema.js";
import { setVariableNodeSchema } from "./transform.nodes.js";
import {
	clickNodeSchema,
	cronJobNodeSchema,
	inputNodeSchema,
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
	["action.github", gitHubNodeSchema],
	["action.gmail", gmailNodeSchema],
	["action.github", gitHubNodeSchema],
	["action.discord", discordNodeSchema],
	["action.notion", notionNodeSchema],
	["action.slack", slackNodeSchema],
]);
