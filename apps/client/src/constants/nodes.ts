import type { WorkflowNode } from "@nodebase/shared";
import type { Node } from "@xyflow/react";
import type { FC, SVGProps } from "react";
import ClickIcon from "@/assets/icons/nodes/click.svg?react";
import ConditionalIcon from "@/assets/icons/nodes/conditional.svg?react";
import GoogleIcon from "@/assets/icons/nodes/google.svg?react";
import HTTPIcon from "@/assets/icons/nodes/http.svg?react";
import SetVarIcon from "@/assets/icons/nodes/set-var.svg?react";
import WaitIcon from "@/assets/icons/nodes/wait.svg?react";

export type NodeUI = {
	name: string;
	type: string;
	icon: FC<SVGProps<SVGSVGElement>>;
	color?: string;
	background?: string;
	fill?: string;
};

export type WorkflowNodeData = WorkflowNode & {
	ui: NodeUI;
} & Record<string, unknown>;

export type WorkflowCanvasNode = Node<WorkflowNodeData>;

export const TRIGGER_NODES_UI: NodeUI[] = [
	{
		name: "Click",
		type: "event.click",
		icon: ClickIcon,
		background: "#0496ff",
	},
	{ name: "API", type: "action.http", icon: HTTPIcon, background: "#736ced" },
];

export const ACTION_NODES_UI: NodeUI[] = [
	{
		name: "Google",
		type: "action.google.search",
		icon: GoogleIcon,
		color: "#4285F4",
	},
	{
		name: "Set Variable",
		type: "action.set_variable",
		icon: SetVarIcon,
	},
	{
		name: "Condition",
		type: "control.condition",
		icon: ConditionalIcon,
		background: "#8338EC",
	},
	{ name: "Wait", type: "event.wait", icon: WaitIcon, background: "#FF9F1C" },
];
