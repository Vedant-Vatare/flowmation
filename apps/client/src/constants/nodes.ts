import type { WorkflowNode } from "@nodebase/shared";
import type { Node } from "@xyflow/react";
import type { FC, SVGProps } from "react";
import AiIcon from "@/assets/icons/nodes/ai.svg?react";
import CalComIcon from "@/assets/icons/nodes/calcom.svg?react";
import ClickIcon from "@/assets/icons/nodes/click.svg?react";
import ConditionalIcon from "@/assets/icons/nodes/conditional.svg?react";
import DiscordIcon from "@/assets/icons/nodes/discord.svg?react";
import GitHubIcon from "@/assets/icons/nodes/github.svg?react";
import GmailIcon from "@/assets/icons/nodes/gmail.svg?react";
import GoogleCalendarIcon from "@/assets/icons/nodes/google-calendar.svg?react";
import GoogleDriveIcon from "@/assets/icons/nodes/google-drive.svg?react";
import GoogleSheetsIcon from "@/assets/icons/nodes/google-sheets.svg?react";
import HTTPIcon from "@/assets/icons/nodes/http.svg?react";
import InputIcon from "@/assets/icons/nodes/input.svg?react";
import JiraIcon from "@/assets/icons/nodes/jira.svg?react";
import LinearIcon from "@/assets/icons/nodes/linear.svg?react";
import MergeIcon from "@/assets/icons/nodes/merge.svg?react";
import NotionIcon from "@/assets/icons/nodes/notion.svg?react";
import RandomIcon from "@/assets/icons/nodes/random.svg?react";
import RazorpayIcon from "@/assets/icons/nodes/razorpay.svg?react";
import ScheduleIcon from "@/assets/icons/nodes/schedule.svg?react";
import SetVarIcon from "@/assets/icons/nodes/set-var.svg?react";
import SlackIcon from "@/assets/icons/nodes/slack.svg?react";
import TelegramIcon from "@/assets/icons/nodes/telegram.svg?react";
import WaitIcon from "@/assets/icons/nodes/wait.svg?react";
import WebhookIcon from "@/assets/icons/nodes/webhook.svg?react";

export type NodeUI = {
	name: string;
	icon: FC<SVGProps<SVGSVGElement>>;
	color?: string;
	background?: string;
	iconBackground?: string;
	fill?: string;
	branded?: boolean;
};

export type PortDefinition = {
	name: string;
	label: string;
};

export type WorkflowNodeData = Pick<
	WorkflowNode,
	| "id"
	| "nodeId"
	| "name"
	| "task"
	| "type"
	| "description"
	| "parameters"
	| "inputPorts"
	| "outputPorts"
	| "workflowId"
	| "credentialId"
	| "settings"
	| "positionX"
	| "positionY"
> & { ui: NodeUI };

export type WorkflowCanvasNode = Node<WorkflowNodeData>;

export const NODE_UI_REGISTRY: Record<string, NodeUI> = {
	"action.ai": {
		name: "AI",
		icon: AiIcon,
		background: "#778da9",
		color: "#ffffff",
	},
	"action.calcom": {
		name: "Cal.com",
		icon: CalComIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#3B82F6",
		branded: true,
	},
	"action.click": {
		name: "Click",
		icon: ClickIcon,
		background: "#0496FF",
		color: "#ffffff",
	},
	"trigger.cron": {
		name: "Schedule",
		icon: ScheduleIcon,
		background: "#F72585",
		color: "#ffffff",
	},
	"trigger.webhook": {
		name: "Webhook",
		icon: WebhookIcon,
		background: "#0F9D6E",
		color: "#fff",
	},
	"trigger.input": {
		name: "Input Trigger",
		icon: InputIcon,
		background: "#2EC4B6",
		color: "#ffffff",
	},
	"action.http": {
		name: "HTTP Request",
		icon: HTTPIcon,
		background: "#6366F1",
		color: "#ffffff",
	},
	"action.condition": {
		name: "Condition",
		icon: ConditionalIcon,
		background: "#8338EC",
		color: "#ffffff",
	},
	"action.wait": {
		name: "Wait",
		icon: WaitIcon,
		background: "#FF9F1C",
		color: "#ffffff",
	},
	"action.set_variable": {
		name: "Set Variable",
		icon: SetVarIcon,
		background: "#119DA4",
		color: "#ffffff",
	},
	"action.random_number": {
		name: "Random Number",
		icon: RandomIcon,
		background: "#717744",
		color: "#ffffff",
	},
	"action.merge": {
		name: "Merge Data",
		icon: MergeIcon,
		background: "#3d348b",
		color: "#ffffff",
	},
	"action.google_drive": {
		name: "Google Drive",
		icon: GoogleDriveIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#1a73e8",
		branded: true,
	},
	"action.google_calendar": {
		name: "Google Calendar",
		icon: GoogleCalendarIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#1a73e8",
		branded: true,
	},
	"action.google_sheets": {
		name: "Google Sheets",
		icon: GoogleSheetsIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#155724",
		branded: true,
	},
	"action.gmail": {
		name: "Gmail",
		icon: GmailIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#EA4335",
		branded: true,
	},
	"action.github": {
		name: "GitHub",
		icon: GitHubIcon,
		background: "#f8f9fa",
		iconBackground: "#fff",
		color: "#24292e",
		branded: true,
	},
	"action.discord": {
		name: "Discord",
		icon: DiscordIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#5865F2",
		branded: true,
	},
	"action.jira": {
		name: "Jira",
		icon: JiraIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#0052CC",
		branded: true,
	},
	"action.linear": {
		name: "Linear",
		icon: LinearIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#5E6AD2",
		branded: true,
	},
	"action.notion": {
		name: "Notion",
		icon: NotionIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#000000",
		branded: true,
	},
	"action.razorpay": {
		name: "Razorpay",
		icon: RazorpayIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#3399FF",
		branded: true,
	},
	"action.slack": {
		name: "Slack",
		icon: SlackIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#E01E5A",
		branded: true,
	},
	"action.telegram": {
		name: "Telegram",
		icon: TelegramIcon,
		background: "#f8f9fa",
		iconBackground: "transparent",
		color: "#26A5E4",
		branded: true,
	},
};

export const DEFAULT_UI: NodeUI = {
	name: "Unknown",
	icon: ClickIcon,
	background: "#6366f1",
	color: "#ffffff",
};
