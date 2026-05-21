import type { NodeJobPayload, WorkflowJobPayload } from "@nodebase/queue";
import type {
	ConditionNode,
	CronNode,
	DiscordNode,
	GitHubNode,
	GmailNode,
	HttpNode,
	InputNode,
	MergeNode,
	NotionNode,
	WaitNode,
	WorkflowNode,
} from "@nodebase/shared";
import type { Job } from "bullmq";
import { conditionNodeExecutor } from "./nodes/actions/condition.node.js";
import { httpNodeExecutor } from "./nodes/actions/http.node.js";
import { discordNodeExecutor } from "./nodes/actions/integrations/discord.node.js";
import { githubNodeExecutor } from "./nodes/actions/integrations/github.node.js";
import { gmailNodeExecutor } from "./nodes/actions/integrations/gmail.node.js";
import { notionNodeExecutor } from "./nodes/actions/integrations/notion.node.js";
import { mergeNodeExecutor } from "./nodes/actions/merge.node.js";
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
		case "action.http":
			return httpNodeExecutor(node as HttpNode, executionId);
		case "action.wait":
			return waitNodeExecutor(node as WaitNode, executionId);
		case "action.condition":
			return conditionNodeExecutor(node as ConditionNode, executionId);
		case "action.merge":
			return mergeNodeExecutor(
				node as MergeNode,
				executionId,
				nodeData?.inputNodeNames,
			);
		case "action.gmail":
			return gmailNodeExecutor(node as GmailNode, executionId);
		case "action.github":
			return githubNodeExecutor(node as GitHubNode, executionId);
		case "action.discord":
			return discordNodeExecutor(node as DiscordNode, executionId);
		case "action.notion":
			return notionNodeExecutor(node as NotionNode, executionId);

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
