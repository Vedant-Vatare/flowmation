import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";
import type { Edge } from "@xyflow/react";
import {
	getNodeUI,
	type WorkflowCanvasNode,
	type WorkflowNodeData,
} from "@/constants/nodes";

export const toCanvasNode = (node: WorkflowNode): WorkflowCanvasNode => ({
	id: node.instanceId,
	type: "workflowNode",
	position: { x: node.positionX, y: node.positionY },
	data: {
		instanceId: node.instanceId,
		name: node.name,
		task: node.task,
		type: node.type as WorkflowNodeData["type"],
		description: node.description,
		parameters: (node.parameters as WorkflowNodeData["parameters"]) ?? [],
		inputPorts: node.inputPorts,
		outputPorts: node.outputPorts,
		settings: node.settings ?? {},
		ui: getNodeUI(node.task),
	},
});

export const toCanvasNodes = (nodes: WorkflowNode[]): WorkflowCanvasNode[] =>
	nodes.map(toCanvasNode);

export const toCanvasEdge = (conn: WorkflowConnection): Edge => ({
	id: conn.id ?? `${conn.sourceInstanceId}-${conn.targetInstanceId}`,
	source: conn.sourceInstanceId,
	target: conn.targetInstanceId,
	sourceHandle: conn.sourceOutput,
	targetHandle: conn.targetInput,
});

export const toCanvasEdges = (connections: WorkflowConnection[]): Edge[] =>
	connections.map(toCanvasEdge);
