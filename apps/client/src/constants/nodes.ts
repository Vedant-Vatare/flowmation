import {
	clickNodeSchema,
	conditionalNodeSchema,
	cronJobNodeSchema,
	httpNodeSchema,
	type NodeParameters,
	type nodeParameterSchema,
	setVariableNodeSchema,
	type WorkflowNode,
	waitingNodeSchema,
} from "@nodebase/shared";
import type { Node } from "@xyflow/react";
import type { FC, SVGProps } from "react";
import type { z } from "zod";
import ClickIcon from "@/assets/icons/nodes/click.svg?react";
import ConditionalIcon from "@/assets/icons/nodes/conditional.svg?react";
import GoogleIcon from "@/assets/icons/nodes/google.svg?react";
import HTTPIcon from "@/assets/icons/nodes/http.svg?react";
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

export type NodeParameter = z.infer<typeof nodeParameterSchema>;

export type WorkflowNodeData = {
	instanceId: string;
	name: string;
	task: string;
	type: "action" | "trigger" | "transform" | "cron" | "helper" | "webhook";
	description?: string;
	parameters: NodeParameters[];
	inputPorts: PortDefinition[];
	outputPorts: PortDefinition[];
	settings: Record<string, unknown>;
	ui: NodeUI;
};

export type WorkflowCanvasNode = Node<WorkflowNodeData>;

export type NodeRegistryEntry = {
	task: string;
	nodeType: "trigger" | "action" | "transform" | "cron" | "helper" | "webhook";
	ui: NodeUI;
	inputPorts: PortDefinition[];
	outputPorts: PortDefinition[];
	schema: z.ZodTypeAny;
	defaultParameters: NodeParameter[];
};

export const NODE_REGISTRY: Record<string, NodeRegistryEntry> = {
	"event.click": {
		task: "event.click",
		nodeType: "trigger",
		ui: {
			name: "Click",
			icon: ClickIcon,
			background: "#0496ff",
			color: "#ffffff",
		},
		inputPorts: [],
		outputPorts: [{ name: "default", label: "Success" }],
		schema: clickNodeSchema,
		defaultParameters: [],
	},

	"action.http": {
		task: "action.http",
		nodeType: "action",
		ui: {
			name: "HTTP Request",
			icon: HTTPIcon,
			background: "#736ced",
			color: "#ffffff",
		},
		inputPorts: [{ name: "default", label: "Input" }],
		outputPorts: [
			{ name: "default", label: "Success" },
			{ name: "error", label: "Error" },
		],
		schema: httpNodeSchema,
		defaultParameters: [
			{ label: "URL", name: "url", type: "input", value: "", required: true },
			{
				label: "Method",
				name: "method",
				type: "dropdown",
				value: "GET",
				required: true,
			},
			{
				label: "Headers",
				name: "headers",
				type: "key-value",
				value: [],
				required: false,
				multiValued: true,
			},
			{
				label: "Body",
				name: "body",
				type: "textarea",
				value: "",
				required: false,
				dependsOn: [
					{ parameter: "method", values: ["POST", "PUT", "PATCH", "DELETE"] },
				],
			},
		],
	},

	"action.google.search": {
		task: "action.google.search",
		nodeType: "action",
		ui: {
			name: "Google Search",
			icon: GoogleIcon,
			color: "#ffffff",
		},
		inputPorts: [{ name: "default", label: "Input" }],
		outputPorts: [{ name: "default", label: "Results" }],
		schema: httpNodeSchema,
		defaultParameters: [
			{
				label: "Query",
				name: "query",
				type: "input",
				value: "",
				required: true,
			},
			{
				label: "Max Results",
				name: "maxResults",
				type: "number",
				value: 10,
				required: false,
			},
		],
	},

	"action.set_variable": {
		task: "action.set_variable",
		nodeType: "action",
		ui: {
			name: "Set Variable",
			icon: SetVarIcon,
			background: "#119da4",
			color: "#ffffff",
		},
		inputPorts: [{ name: "default", label: "Input" }],
		outputPorts: [{ name: "default", label: "Done" }],
		schema: setVariableNodeSchema,
		defaultParameters: [
			{
				label: "Variable Name",
				name: "variable_name",
				type: "input",
				value: "",
				required: true,
			},
			{
				label: "Value",
				name: "value",
				type: "input",
				value: "",
				required: true,
			},
		],
	},

	"control.condition": {
		task: "control.condition",
		nodeType: "action",
		ui: {
			name: "Condition",
			icon: ConditionalIcon,
			background: "#8338EC",
			color: "#ffffff",
		},
		inputPorts: [{ name: "default", label: "Input" }],
		outputPorts: [
			{ name: "true", label: "True" },
			{ name: "false", label: "False" },
		],
		schema: conditionalNodeSchema,
		defaultParameters: [
			{
				label: "Left Operand",
				name: "left_operand",
				type: "input",
				value: "",
				required: true,
			},
			{
				label: "Operator",
				name: "operator",
				type: "dropdown",
				value: "eq",
				required: true,
			},
			{
				label: "Right Operand",
				name: "right_operand",
				type: "input",
				value: "",
				required: true,
			},
		],
	},

	"event.wait": {
		task: "event.wait",
		nodeType: "action",
		ui: {
			name: "Wait",
			icon: WaitIcon,
			background: "#FF9F1C",
			color: "#ffffff",
		},
		inputPorts: [{ name: "default", label: "Input" }],
		outputPorts: [{ name: "default", label: "Done" }],
		schema: waitingNodeSchema,
		defaultParameters: [
			{
				label: "Start on",
				name: "start",
				type: "dropdown",
				value: "time_period",
				required: true,
			},
			{
				label: "Wait time",
				name: "wait_time_period",
				type: "number",
				value: 10,
				required: true,
				dependsOn: [{ parameter: "start", values: ["time_period"] }],
			},
			{
				label: "Time unit",
				name: "time_unit",
				type: "dropdown",
				value: "seconds",
				required: true,
				dependsOn: [{ parameter: "start", values: ["time_period"] }],
			},
			{
				label: "At specific time",
				name: "date_time",
				type: "date",
				value: "",
				required: true,
				dependsOn: [{ parameter: "start", values: ["date_time"] }],
			},
		],
	},

	"trigger.cron": {
		task: "trigger.cron",
		nodeType: "trigger",
		ui: {
			name: "Schedule",
			icon: ClickIcon,
			background: "#e63946",
			color: "#ffffff",
		},
		inputPorts: [],
		outputPorts: [{ name: "default", label: "On Schedule" }],
		schema: cronJobNodeSchema,
		defaultParameters: [
			{ label: "Minutes", name: "minutes", type: "number", value: 0 },
			{ label: "Hour", name: "hour", type: "number", value: 0 },
			{
				label: "Day of Month",
				name: "day_of_the_month",
				type: "number",
				value: 0,
			},
			{ label: "Month", name: "month", type: "number", value: 0 },
		],
	},
};

export const TRIGGER_NODES: NodeRegistryEntry[] = Object.values(
	NODE_REGISTRY,
).filter((n) => n.nodeType === "trigger");

export const ACTION_NODES: NodeRegistryEntry[] = Object.values(
	NODE_REGISTRY,
).filter((n) => n.nodeType !== "trigger");

export function getNodeUI(task: string): NodeUI {
	return (
		NODE_REGISTRY[task]?.ui ?? {
			name: task,
			icon: ClickIcon,
			background: "#6366f1",
			color: "#ffffff",
		}
	);
}

export function getNodeColorByTask(task: string): string {
	return NODE_REGISTRY[task]?.ui.background ?? "#6366f1";
}

export function getNodeSchema(task: string): z.ZodTypeAny | undefined {
	return NODE_REGISTRY[task]?.schema;
}

export function createCanvasNode(
	task: string,
	position: { x: number; y: number } = { x: 100, y: 100 },
): WorkflowCanvasNode {
	const entry = NODE_REGISTRY[task];
	if (!entry) throw new Error(`No registry entry for task: ${task}`);

	const instanceId = `${task}__${Date.now()}`;

	return {
		id: instanceId,
		type: "workflowNode",
		position,
		data: {
			instanceId,
			task,
			name: entry.ui.name,
			type: entry.nodeType,
			ui: entry.ui,
			inputPorts: entry.inputPorts,
			outputPorts: entry.outputPorts,
			parameters: structuredClone(entry.defaultParameters),
			settings: {},
		},
	};
}

export function toApiNode(
	canvasNode: WorkflowCanvasNode,
	workflowId: string,
	nodeId: string,
): Omit<WorkflowNode, "id"> {
	const { ui: _ui, ...data } = canvasNode.data;

	return {
		workflowId,
		nodeId,
		instanceId: data.instanceId,
		name: data.name,
		task: data.task,
		type: data.type,
		description: data.description ?? "",
		parameters: data.parameters,
		inputPorts: data.inputPorts,
		outputPorts: data.outputPorts,
		settings: data.settings,
		positionX: canvasNode.position.x,
		positionY: canvasNode.position.y,
	};
}
