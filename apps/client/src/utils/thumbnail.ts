import type { TemplateData } from "@nodebase/shared";
import {
	getNodesBounds,
	getViewportForBounds,
	type Edge,
	type Node,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import type { WorkflowCanvasNode, WorkflowNodeData } from "@/constants/nodes";
import { getNodeUI } from "./nodes/nodes.utils";

export const toThumbnailCanvasNodes = (
	templateNodes: TemplateData["nodes"],
): WorkflowCanvasNode[] =>
	templateNodes.map((node) => ({
		id: node.id,
		type: "workflowNode",
		position: { x: node.positionX ?? 100, y: node.positionY ?? 100 },
		data: {
			id: node.id,
			nodeId: undefined as unknown as string,
			workflowId: undefined as unknown as string,
			name: node.name,
			task: node.task,
			type: node.type as WorkflowNodeData["type"],
			description: node.description,
			parameters: (node.parameters as WorkflowNodeData["parameters"]) ?? [],
			inputPorts: (node.inputPorts as WorkflowNodeData["inputPorts"]) ?? [],
			outputPorts: (node.outputPorts as WorkflowNodeData["outputPorts"]) ?? [],
			credentialId: null,
			settings: node.settings,
			positionX: node.positionX,
			positionY: node.positionY,
			ui: getNodeUI(node.task),
		},
	}));

export const toThumbnailCanvasEdges = (
	connections: TemplateData["connections"],
): Edge[] =>
	connections.map((connection) => ({
		id: connection.id,
		source: connection.sourceId,
		target: connection.targetId,
		sourceHandle: connection.sourcePort,
		targetHandle: connection.targetPort,
		type: "workflow",
	}));

export type CaptureFlowOptions = {
	width: number;
	height: number;
	pixelRatio?: number;
	minZoom?: number;
	maxZoom?: number;
};

export const fitNodesViewport = (
	nodes: Node[],
	width: number,
	height: number,
	minZoom = 0.1,
	maxZoom = 2,
	padding = 0.1,
) =>
	getViewportForBounds(
		getNodesBounds(nodes),
		width,
		height,
		minZoom,
		maxZoom,
		padding,
	);

export const captureFlowDataUrl = async (
	root: HTMLElement,
	options: { width: number; height: number; pixelRatio?: number },
): Promise<string> => {
	const { width, height, pixelRatio = 2 } = options;

	return toPng(root, {
		backgroundColor: "#ffffff",
		width,
		height,
		pixelRatio,
	});
};
