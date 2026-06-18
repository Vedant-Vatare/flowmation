import { MarkerType } from "@xyflow/react";
import {
	DEFAULT_UI,
	NODE_UI_REGISTRY,
	type NodeUI,
	type WorkflowCanvasNode,
	type WorkflowNodeData,
} from "@/constants/nodes";

export type WorkflowData = {
	nodes: WorkflowCanvasNode[];
	edges: { id: string; source: string; target: string }[];
};

export function createMockNode(
	id: string,
	task: string,
	name: string,
	type: "trigger" | "action",
	position: { x: number; y: number },
	inputPorts: { name: string; label: string }[] = [],
	outputPorts: { name: string; label: string }[] = [],
): WorkflowCanvasNode {
	const ui: NodeUI = NODE_UI_REGISTRY[task] ?? DEFAULT_UI;
	return {
		id,
		type: "workflowNode",
		position,
		data: {
			id,
			nodeId: id,
			name,
			task,
			type,
			description: "",
			parameters: [],
			inputPorts,
			outputPorts,
			workflowId: "preview",
			credentialId: null,
			settings: {},
			positionX: position.x,
			positionY: position.y,
			ui,
		} satisfies WorkflowNodeData,
	};
}

export const WORKFLOWS: Record<string, WorkflowData> = {
	email: {
		nodes: [
			createMockNode(
				"n1",
				"trigger.webhook",
				"Receive Email Event",
				"trigger",
				{ x: 50, y: 200 },
				[],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n2",
				"action.gmail",
				"Parse Email Content",
				"action",
				{ x: 320, y: 200 },
				[{ name: "input", label: "Input" }],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n3",
				"action.slack",
				"Notify Team Channel",
				"action",
				{ x: 590, y: 200 },
				[{ name: "input", label: "Input" }],
				[],
			),
		],
		edges: [
			{ id: "e1", source: "n1", target: "n2" },
			{ id: "e2", source: "n2", target: "n3" },
		],
	},
	meeting: {
		nodes: [
			createMockNode(
				"n1",
				"trigger.webhook",
				"Capture Booking Request",
				"trigger",
				{ x: 50, y: 200 },
				[],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n2",
				"action.google_calendar",
				"Check Availability",
				"action",
				{ x: 320, y: 120 },
				[{ name: "input", label: "Input" }],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n3",
				"action.gmail",
				"Send Confirmation Email",
				"action",
				{ x: 320, y: 300 },
				[{ name: "input", label: "Input" }],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n4",
				"action.slack",
				"Alert Sales Team",
				"action",
				{ x: 590, y: 200 },
				[{ name: "input", label: "Input" }],
				[],
			),
		],
		edges: [
			{ id: "e1", source: "n1", target: "n2" },
			{ id: "e2", source: "n1", target: "n3" },
			{ id: "e3", source: "n2", target: "n4" },
			{ id: "e4", source: "n3", target: "n4" },
		],
	},
	support: {
		nodes: [
			createMockNode(
				"n1",
				"trigger.webhook",
				"New Support Ticket",
				"trigger",
				{ x: 50, y: 200 },
				[],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n2",
				"action.ai",
				"Classify Ticket Priority",
				"action",
				{ x: 320, y: 200 },
				[{ name: "input", label: "Input" }],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n3",
				"action.gmail",
				"Draft Auto-Reply",
				"action",
				{ x: 590, y: 120 },
				[{ name: "input", label: "Input" }],
				[{ name: "output", label: "Output" }],
			),
			createMockNode(
				"n4",
				"action.slack",
				"Escalate to Agent",
				"action",
				{ x: 590, y: 300 },
				[{ name: "input", label: "Input" }],
				[],
			),
		],
		edges: [
			{ id: "e1", source: "n1", target: "n2" },
			{ id: "e2", source: "n2", target: "n3" },
			{ id: "e3", source: "n2", target: "n4" },
		],
	},
};

export const EDGE_STYLE = {
	markerEnd: { type: MarkerType.ArrowClosed },
	style: { strokeWidth: 2, stroke: "var(--muted-foreground)" },
};
