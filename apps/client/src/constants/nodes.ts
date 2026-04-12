import type { WorkflowNode } from "@nodebase/shared";
import type { Node } from "@xyflow/react";
import type { FC, SVGProps } from "react";
import ClickIcon from "@/assets/icons/nodes/click.svg?react";
import ConditionalIcon from "@/assets/icons/nodes/conditional.svg?react";
import HTTPIcon from "@/assets/icons/nodes/http.svg?react";
import InputIcon from "@/assets/icons/nodes/input.svg?react";
import MergeIcon from "@/assets/icons/nodes/merge.svg?react";
import RandomIcon from "@/assets/icons/nodes/random.svg?react";
import ScheduleIcon from "@/assets/icons/nodes/schedule.svg?react";
import SetVarIcon from "@/assets/icons/nodes/set-var.svg?react";
import WaitIcon from "@/assets/icons/nodes/wait.svg?react";

export type NodeUI = {
	name: string;
	icon: FC<SVGProps<SVGSVGElement>>;
	color?: string;
	background?: string;
	fill?: string;
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
	| "config"
	| "inputPorts"
	| "outputPorts"
	| "workflowId"
	| "credentials"
	| "settings"
	| "positionX"
	| "positionY"
> & { ui: NodeUI };

export type WorkflowCanvasNode = Node<WorkflowNodeData>;

export const NODE_UI_REGISTRY: Record<string, NodeUI> = {
	"event.click": {
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
};

export const DEFAULT_UI: NodeUI = {
	name: "Unknown",
	icon: ClickIcon,
	background: "#6366f1",
	color: "#ffffff",
};
