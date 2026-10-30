import { getDecryptedCredential } from "@nodebase/db";
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
	CsvNode,
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
	MailchimpNode,
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
	XmlNode,
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
import { mailchimpNodeExecutor } from "./nodes/actions/integrations/mailchimp.node.js";
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
import { csvNodeExecutor } from "./nodes/actions/transform/csv.node.js";
import { dateTimeNodeExecutor } from "./nodes/actions/transform/date-time.node.js";
import { filterNodeExecutor } from "./nodes/actions/transform/filter.node.js";
import { jsonTransformNodeExecutor } from "./nodes/actions/transform/json-transform.node.js";
import { numberTransformNodeExecutor } from "./nodes/actions/transform/number-transform.node.js";
import { textTransformNodeExecutor } from "./nodes/actions/transform/text-transform.node.js";
import { xmlNodeExecutor } from "./nodes/actions/transform/xml.node.js";
import { waitNodeExecutor } from "./nodes/actions/wait.node.js";
import { inputNodeExecutor } from "./nodes/triggers/input.node.js";
import { scheduleNodeExecutor } from "./nodes/triggers/schedule.node.js";
import type {
	DecryptedCredential,
	NodeExecutorOutput,
	TriggerNodeExecutorOutput,
} from "./types/nodes.js";
import {
	checkRequiredParameters,
	getResolvedParams,
} from "./utils/node.executor.utils.js";

const credentialNodeExecutors: Record<
	string,
	(
		node: WorkflowNode,
		executionId: string,
		credential: DecryptedCredential,
	) => Promise<NodeExecutorOutput>
> = {
	"action.ai": (node, executionId, credential) =>
		aiNodeExecutor(node as AiNode, executionId, credential),
	"action.airtable": (node, executionId, credential) =>
		airtableNodeExecutor(node as AirtableNode, executionId, credential),
	"action.asana": (node, executionId, credential) =>
		asanaNodeExecutor(node as AsanaNode, executionId, credential),
	"action.calcom": (node, executionId, credential) =>
		calcomNodeExecutor(node as CalcomNode, executionId, credential),
	"action.clickup": (node, executionId, credential) =>
		clickupNodeExecutor(node as ClickUpNode, executionId, credential),
	"action.discord": (node, executionId, credential) =>
		discordNodeExecutor(node as DiscordNode, executionId, credential),
	"action.firebase": (node, executionId, credential) =>
		firebaseNodeExecutor(node as FirebaseNode, executionId, credential),
	"action.github": (node, executionId, credential) =>
		githubNodeExecutor(node as GitHubNode, executionId, credential),
	"action.gmail": (node, executionId, credential) =>
		gmailNodeExecutor(node as GmailNode, executionId, credential),
	"action.google_calendar": (node, executionId, credential) =>
		googleCalendarNodeExecutor(
			node as GoogleCalendarNode,
			executionId,
			credential,
		),
	"action.google_docs": (node, executionId, credential) =>
		googleDocsNodeExecutor(node as GoogleDocsNode, executionId, credential),
	"action.google_drive": (node, executionId, credential) =>
		googleDriveNodeExecutor(node as GoogleDriveNode, executionId, credential),
	"action.google_sheets": (node, executionId, credential) =>
		googleSheetsNodeExecutor(node as GoogleSheetsNode, executionId, credential),
	"action.hubspot": (node, executionId, credential) =>
		hubspotNodeExecutor(node as HubSpotNode, executionId, credential),
	"action.jira": (node, executionId, credential) =>
		jiraNodeExecutor(node as JiraNode, executionId, credential),
	"action.linear": (node, executionId, credential) =>
		linearNodeExecutor(node as LinearNode, executionId, credential),
	"action.mailchimp": (node, executionId, credential) =>
		mailchimpNodeExecutor(node as MailchimpNode, executionId, credential),
	"action.mongodb": (node, executionId, credential) =>
		mongodbNodeExecutor(node as MongodbNode, executionId, credential),
	"action.notion": (node, executionId, credential) =>
		notionNodeExecutor(node as NotionNode, executionId, credential),
	"action.postgres": (node, executionId, credential) =>
		postgresNodeExecutor(node as PostgresNode, executionId, credential),
	"action.razorpay": (node, executionId, credential) =>
		razorpayNodeExecutor(node as RazorpayNode, executionId, credential),
	"action.redis": (node, executionId, credential) =>
		redisNodeExecutor(node as RedisNode, executionId, credential),
	"action.sentry": (node, executionId, credential) =>
		sentryNodeExecutor(node as SentryNode, executionId, credential),
	"action.slack": (node, executionId, credential) =>
		slackNodeExecutor(node as SlackNode, executionId, credential),
	"action.supabase": (node, executionId, credential) =>
		supabaseNodeExecutor(node as SupabaseNode, executionId, credential),
	"action.telegram": (node, executionId, credential) =>
		telegramNodeExecutor(node as TelegramNode, executionId, credential),
	"action.todoist": (node, executionId, credential) =>
		todoistNodeExecutor(node as TodoistNode, executionId, credential),
	"action.trello": (node, executionId, credential) =>
		trelloNodeExecutor(node as TrelloNode, executionId, credential),
	"action.twilio": (node, executionId, credential) =>
		twilioNodeExecutor(node as TwilioNode, executionId, credential),
};

export const executeNode = async ({
	userId,
	workflowId,
	executionId,
	node,
	nodeData,
}: NodeJobPayload): Promise<NodeExecutorOutput> => {
	const { valid, missing } = checkRequiredParameters(node.parameters);

	if (!valid) {
		return {
			success: false,
			message: `Missing required parameters: ${missing.join(", ")}`,
		};
	}

	const credentialExecutor = Object.hasOwn(credentialNodeExecutors, node.task)
		? credentialNodeExecutors[node.task]
		: undefined;

	if (credentialExecutor) {
		let executionNode = node;

		if (node.task === "action.discord") {
			try {
				const params = await getResolvedParams(node, executionId);
				executionNode = {
					...node,
					parameters: Object.values(params),
					settings: { ...node.settings, hasExpressions: false },
				};

				if (params.operation?.value !== "send_dm") {
					return discordNodeExecutor(
						executionNode as DiscordNode,
						executionId,
						null,
					);
				}
			} catch {
				return {
					success: false,
					message: "Could not resolve Discord parameters",
				};
			}
		}

		if (!node.credentialId)
			return { success: false, message: "Select a credential for this node" };

		if (node.workflowId !== workflowId) {
			return {
				success: false,
				message: "Node does not belong to this workflow",
			};
		}

		if (!userId) {
			return { success: false, message: "Workflow execution owner is missing" };
		}

		let credential: DecryptedCredential;

		try {
			credential = await getDecryptedCredential(node.credentialId, userId);
		} catch {
			return {
				success: false,
				message:
					"Could not load the selected credential. Check the connection and try again.",
			};
		}

		return credentialExecutor(executionNode, executionId, credential);
	}

	switch (node.task) {
		case "action.xml":
			return xmlNodeExecutor(node as XmlNode, executionId);
		case "action.csv":
			return csvNodeExecutor(node as CsvNode, executionId);

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
		case "trigger.discord":
		case "trigger.github":
		case "trigger.gmail":
		case "trigger.google_calendar":
			return { success: true, output: job.data.triggerData };
		default:
			return {
				success: false,
				skipCurrentExecution: true,
				message: `trigger node does not exist: ${triggerNode.task}`,
			};
	}
};
