import type {
	BaseNode,
	NodeParameters,
	WorkflowConnection,
	WorkflowNode,
} from "@nodebase/shared";
import type { Edge, XYPosition } from "@xyflow/react";
import {
	DEFAULT_UI,
	NODE_UI_REGISTRY,
	type NodeUI,
	type PortDefinition,
	type WorkflowCanvasNode,
	type WorkflowNodeData,
} from "@/constants/nodes";

export const toCanvasNode = (node: WorkflowNode): WorkflowCanvasNode => ({
	id: node.id ?? crypto.randomUUID(),
	type: "workflowNode",
	position: { x: node.positionX ?? 100, y: node.positionY ?? 100 },
	data: {
		id: node.id ?? "",
		nodeId: node.nodeId,
		workflowId: node.workflowId,
		name: node.name,
		task: node.task,
		type: node.type as WorkflowNodeData["type"],
		description: node.description,
		parameters: (node.parameters as WorkflowNodeData["parameters"]) ?? [],
		inputPorts: (node.inputPorts as WorkflowNodeData["inputPorts"]) ?? [],
		outputPorts: (node.outputPorts as WorkflowNodeData["outputPorts"]) ?? [],
		config: node.config,
		credentials: node.credentials,
		settings: node.settings,
		positionX: node.positionX,
		positionY: node.positionY,
		ui: getNodeUI(node.task),
	},
});

export function getNodeUI(task: string): NodeUI {
	return NODE_UI_REGISTRY[task] ?? { ...DEFAULT_UI, name: task };
}

export function getNodeColorByTask(task: string): string {
	return NODE_UI_REGISTRY[task]?.background ?? "#6366f1";
}

export type CanvasNodeProps = {
	apiNode: BaseNode;
	workflowId: string;
	position: XYPosition;
};

export function createCanvasNode({
	apiNode,
	workflowId,
	position = { x: 100, y: 100 },
}: CanvasNodeProps): WorkflowCanvasNode {
	const id = crypto.randomUUID();
	const ui = getNodeUI(apiNode.task);

	return {
		id,
		type: "workflowNode",
		position,
		data: {
			id,
			nodeId: apiNode.id,
			workflowId,
			task: apiNode.task,
			name: ui.name,
			type: apiNode.type as WorkflowNodeData["type"],
			description: apiNode.description,
			positionX: position.x,
			positionY: position.y,
			ui,
			inputPorts: (apiNode.inputPorts as PortDefinition[]) ?? [
				{ name: "default", label: "Default" },
			],
			outputPorts: (apiNode.outputPorts as PortDefinition[]) ?? [
				{ name: "default", label: "Default" },
			],
			parameters: structuredClone(
				(apiNode.parameters as NodeParameters[]) ?? [],
			),
			config: apiNode.config,
		},
	};
}

export function createWorkflowNode(
	canvasNode: WorkflowCanvasNode,
): WorkflowNode {
	const { ui: _ui, ...data } = canvasNode.data;

	return {
		...data,
		id: data.id,
		positionX: canvasNode.position.x,
		positionY: canvasNode.position.y,
		description: data.description ?? "",
		parameters: data.parameters ?? [],
		inputPorts: data.inputPorts ?? [],
		outputPorts: data.outputPorts ?? [],
	};
}

export const toCanvasNodes = (nodes: WorkflowNode[]): WorkflowCanvasNode[] =>
	nodes.map(toCanvasNode);

export const toCanvasEdge = (conn: WorkflowConnection): Edge => ({
	id: conn.id ?? crypto.randomUUID(),
	source: conn.sourceId,
	target: conn.targetId,
	sourceHandle: conn.sourcePort,
	targetHandle: conn.targetPort,
});

export const toCanvasEdges = (connections: WorkflowConnection[]): Edge[] =>
	connections.map(toCanvasEdge);
