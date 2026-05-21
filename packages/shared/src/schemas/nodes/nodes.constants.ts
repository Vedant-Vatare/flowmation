import type z from "zod";
import {
	httpNodeSchema,
	mergeDataNodeSchema,
	waitingNodeSchema,
} from "./action.nodes.js";
import { conditionalNodeSchema } from "./control.nodes.js";
import { gitHubNodeSchema } from "./integrations/github.schema.js";
import { gmailNodeSchema } from "./integrations/gmail.schema.js";
import { setVariableNodeSchema } from "./transform.nodes.js";
import {
	clickNodeSchema,
	cronJobNodeSchema,
	inputNodeSchema,
	webhookNodeSchema,
} from "./trigger.nodes.js";

export const nodeSchemaRegistry = new Map<string, z.ZodObject>([
	["action.http", httpNodeSchema],
	["action.merge", mergeDataNodeSchema],
	["action.wait", waitingNodeSchema],
	["action.gmail", gmailNodeSchema],
	["action.github", gitHubNodeSchema],
	["action.set_variable", setVariableNodeSchema],
	["trigger.input", inputNodeSchema],
	["trigger.cron", cronJobNodeSchema],
	["trigger.click", clickNodeSchema],
	["trigger.webhook", webhookNodeSchema],
	["action.condition", conditionalNodeSchema],
]);
