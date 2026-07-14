import type { NodeJobPayload, WorkflowJobPayload } from "@nodebase/queue";
import type {
	AiNode,
	AirtableNode,
	ArrayTransformNode,
	AsanaNode,
	CalcomNode,
	ClickUpNode,
	ConditionNode,
	CronNode,
	DateTimeNode,
	DiscordNode,
	FilterNode,
	FirebaseNode,
	GitHubNode,
	GmailNode,
	GoogleCalendarNode,
	GoogleDocsNode,
	GoogleDriveNode,
	GoogleSheetsNode,
	HttpNode,
	HubSpotNode,
	InputNode,
	JiraNode,
	JsonTransformNode,
	LinearNode,
	LoopNode,
	MergeNode,
	MongodbNode,
	NotionNode,
	NumberTransformNode,
	PostgresNode,
	RazorpayNode,
	RedisNode,
	SentryNode,
	SlackNode,
	SupabaseNode,
	TelegramNode,
	TextTransformNode,
	TodoistNode,
	TrelloNode,
	TwilioNode,
	WaitNode,
	WorkflowNode,
} from "@nodebase/shared";
import type { Job } from "bullmq";
import { conditionNodeExecutor } from "./nodes/actions/condition.node.js";
import { httpNodeExecutor } from "./nodes/actions/http.node.js";
import { aiNodeExecutor } from "./nodes/actions/integrations/ai.node.js";
import { airtableNodeExecutor } from "./nodes/actions/integrations/airtable.node.js";
import { asanaNodeExecutor } from "./nodes/actions/integrations/asana.node.js";
import { calcomNodeExecutor } from "./nodes/actions/integrations/calcom.node.js";
import { clickupNodeExecutor } from "./nodes/actions/integrations/clickup.node.js";
import { discordNodeExecutor } from "./nodes/actions/integrations/discord.node.js";
import { firebaseNodeExecutor } from "./nodes/actions/integrations/firebase.node.js";
import { githubNodeExecutor } from "./nodes/actions/integrations/github.node.js";
import { gmailNodeExecutor } from "./nodes/actions/integrations/gmail.node.js";
import { googleCalendarNodeExecutor } from "./nodes/actions/integrations/google-calendar.node.js";
import { googleDocsNodeExecutor } from "./nodes/actions/integrations/google-docs.node.js";
import { googleDriveNodeExecutor } from "./nodes/actions/integrations/google-drive.node.js";
import { googleSheetsNodeExecutor } from "./nodes/actions/integrations/google-sheets.node.js";
import { hubspotNodeExecutor } from "./nodes/actions/integrations/hubspot.node.js";
import { jiraNodeExecutor } from "./nodes/actions/integrations/jira.node.js";
import { linearNodeExecutor } from "./nodes/actions/integrations/linear.node.js";
import { mongodbNodeExecutor } from "./nodes/actions/integrations/mongodb.node.js";
import { notionNodeExecutor } from "./nodes/actions/integrations/notion.node.js";
import { postgresNodeExecutor } from "./nodes/actions/integrations/postgres.node.js";
import { razorpayNodeExecutor } from "./nodes/actions/integrations/razorpay.node.js";
import { redisNodeExecutor } from "./nodes/actions/integrations/redis.node.js";
import { sentryNodeExecutor } from "./nodes/actions/integrations/sentry.node.js";
import { slackNodeExecutor } from "./nodes/actions/integrations/slack.node.js";
import { supabaseNodeExecutor } from "./nodes/actions/integrations/supabase.node.js";
import { telegramNodeExecutor } from "./nodes/actions/integrations/telegram.node.js";
import { todoistNodeExecutor } from "./nodes/actions/integrations/todoist.node.js";
import { trelloNodeExecutor } from "./nodes/actions/integrations/trello.node.js";
import { twilioNodeExecutor } from "./nodes/actions/integrations/twilio.node.js";
import { loopNodeExecutor } from "./nodes/actions/loop.node.js";
import { mergeNodeExecutor } from "./nodes/actions/merge.node.js";
import { arrayTransformNodeExecutor } from "./nodes/actions/transform/array-transform.node.js";
import { dateTimeNodeExecutor } from "./nodes/actions/transform/date-time.node.js";
import { filterNodeExecutor } from "./nodes/actions/transform/filter.node.js";
import { jsonTransformNodeExecutor } from "./nodes/actions/transform/json-transform.node.js";
import { numberTransformNodeExecutor } from "./nodes/actions/transform/number-transform.node.js";
import { textTransformNodeExecutor } from "./nodes/actions/transform/text-transform.node.js";
import { waitNodeExecutor } from "./nodes/actions/wait.node.js";
import { inputNodeExecutor } from "./nodes/triggers/input.node.js";
import { scheduleNodeExecutor } from "./nodes/triggers/schedule.node.js";
import type {
	NodeExecutorOutput,
	TriggerNodeExecutorOutput,
} from "./types/nodes.js";
import { checkRequiredParameters } from "./utils/node.executor.utils.js";

export const executeNode = ({
	executionId,
	node,
	nodeData,
}: NodeJobPayload): Promise<NodeExecutorOutput> | NodeExecutorOutput => {
	const { valid, missing } = checkRequiredParameters(node.parameters);

	if (!valid) {
		return {
			success: false,
			message: `Missing required parameters: ${missing.join(", ")}`,
		};
	}
	switch (node.task) {
		case "action.airtable":
			return airtableNodeExecutor(node as AirtableNode, executionId);
		case "action.ai":
			return aiNodeExecutor(node as AiNode, executionId);
		case "action.asana":
			return asanaNodeExecutor(node as AsanaNode, executionId);
		case "action.calcom":
			return calcomNodeExecutor(node as CalcomNode, executionId);
		case "action.clickup":
			return clickupNodeExecutor(node as ClickUpNode, executionId);
		case "action.http":
			return httpNodeExecutor(node as HttpNode, executionId);
		case "action.wait":
			return waitNodeExecutor(node as WaitNode, executionId);
		case "action.condition":
			return conditionNodeExecutor(node as ConditionNode, executionId);
		case "action.loop":
			return loopNodeExecutor(node as LoopNode, nodeData?.loopState);
		case "action.merge":
			return mergeNodeExecutor(
				node as MergeNode,
				executionId,
				nodeData?.inputNodeNames,
			);
		case "action.google_drive":
			return googleDriveNodeExecutor(node as GoogleDriveNode, executionId);
		case "action.gmail":
			return gmailNodeExecutor(node as GmailNode, executionId);
		case "action.google_calendar":
			return googleCalendarNodeExecutor(
				node as GoogleCalendarNode,
				executionId,
			);
		case "action.google_docs":
			return googleDocsNodeExecutor(node as GoogleDocsNode, executionId);
		case "action.google_sheets":
			return googleSheetsNodeExecutor(node as GoogleSheetsNode, executionId);
		case "action.hubspot":
			return hubspotNodeExecutor(node as HubSpotNode, executionId);
		case "action.github":
			return githubNodeExecutor(node as GitHubNode, executionId);
		case "action.discord":
			return discordNodeExecutor(node as DiscordNode, executionId);
		case "action.firebase":
			return firebaseNodeExecutor(node as FirebaseNode, executionId);
		case "action.jira":
			return jiraNodeExecutor(node as JiraNode, executionId);
		case "action.linear":
			return linearNodeExecutor(node as LinearNode, executionId);
		case "action.mongodb":
			return mongodbNodeExecutor(node as MongodbNode, executionId);
		case "action.notion":
			return notionNodeExecutor(node as NotionNode, executionId);
		case "action.postgres":
			return postgresNodeExecutor(node as PostgresNode, executionId);
		case "action.redis":
			return redisNodeExecutor(node as RedisNode, executionId);
		case "action.razorpay":
			return razorpayNodeExecutor(node as RazorpayNode, executionId);
		case "action.sentry":
			return sentryNodeExecutor(node as SentryNode, executionId);
		case "action.slack":
			return slackNodeExecutor(node as SlackNode, executionId);
		case "action.supabase":
			return supabaseNodeExecutor(node as SupabaseNode, executionId);
		case "action.telegram":
			return telegramNodeExecutor(node as TelegramNode, executionId);
		case "action.todoist":
			return todoistNodeExecutor(node as TodoistNode, executionId);
		case "action.trello":
			return trelloNodeExecutor(node as TrelloNode, executionId);
		case "action.twilio":
			return twilioNodeExecutor(node as TwilioNode, executionId);
		case "action.json_transform":
			return jsonTransformNodeExecutor(node as JsonTransformNode, executionId);
		case "action.text_transform":
			return textTransformNodeExecutor(node as TextTransformNode, executionId);
		case "action.number_transform":
			return numberTransformNodeExecutor(
				node as NumberTransformNode,
				executionId,
			);
		case "action.array_transform":
			return arrayTransformNodeExecutor(
				node as ArrayTransformNode,
				executionId,
			);
		case "action.date_time":
			return dateTimeNodeExecutor(node as DateTimeNode, executionId);
		case "action.filter":
			return filterNodeExecutor(node as FilterNode, executionId);

		default:
			return {
				success: false,
				message: `node with given task does not exist: ${node.task}`,
			};
	}
};

export const executeTriggerNode = async (
	triggerNode: WorkflowNode,
	job: Job<WorkflowJobPayload>,
): Promise<TriggerNodeExecutorOutput> => {
	const { valid, missing } = checkRequiredParameters(triggerNode.parameters);

	if (!valid) {
		return {
			success: false,
			skipCurrentExecution: true,
			message: `Missing required parameters: ${missing.join(", ")}`,
		};
	}
	switch (triggerNode.task) {
		case "trigger.cron":
			return scheduleNodeExecutor(triggerNode as CronNode, job);
		case "trigger.click":
			return { success: true };
		case "trigger.input":
			return inputNodeExecutor(triggerNode as InputNode);
		case "trigger.webhook":
			return { success: true, output: job.data.triggerData };
		default:
			return {
				success: false,
				skipCurrentExecution: true,
				message: `trigger node does not exist: ${triggerNode.task}`,
			};
	}
};
