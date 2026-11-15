import type { Edge, InternalNode } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkNode, ElkPort, LayoutOptions } from "elkjs/lib/elk-api";
import type { WorkflowCanvasNode } from "@/constants/nodes";

const WORKFLOW_LAYOUT_OPTIONS: LayoutOptions = {
	"elk.algorithm": "layered",
	"elk.direction": "RIGHT",
	"elk.separateConnectedComponents": "false",
	"elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",
	"elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
	"elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
	"elk.layered.nodePlacement.favorStraightEdges": "false",
	"elk.spacing.nodeNode": "60",
	"elk.layered.spacing.nodeNodeBetweenLayers": "140",
	"elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
};

const getPortId = (nodeId: string, side: string, name: string) =>
	JSON.stringify([nodeId, side, name]);

function createLayoutNode(
	node: WorkflowCanvasNode,
	isStart: boolean,
	internalNode?: InternalNode<WorkflowCanvasNode>,
): ElkNode {
	const portCount = Math.max(
		1,
		node.data.inputPorts.length,
		node.data.outputPorts.length,
	);
	const fallbackHeight = Math.max(48, 24 + (portCount - 1) * 20) + 28;
	const width = node.measured?.width ?? node.width ?? 100;
	const height = node.measured?.height ?? node.height ?? fallbackHeight;
	const handleBounds = internalNode?.internals.handleBounds;
	const portGroups = [
		{
			side: "WEST",
			definitions: node.data.inputPorts,
			handles: handleBounds?.target,
		},
		{
			side: "EAST",
			definitions: node.data.outputPorts,
			handles: handleBounds?.source,
		},
	] as const;
	const ports: ElkPort[] = [];

	for (const { side, definitions, handles } of portGroups) {
		for (const [index, port] of definitions.entries()) {
			const id = getPortId(node.id, side, port.name);
			const handle = handles?.find((item) => item.id === port.name);
			const boxCenterY = (height - 28) / 2;
			const portOffset = (index - (definitions.length - 1) / 2) * 20;
			const fallbackY = boxCenterY + portOffset;
			const y = handle ? handle.y + handle.height / 2 : fallbackY;

			ports.push({
				id,
				x: side === "WEST" ? 0 : width,
				y,
				width: 0,
				height: 0,
				layoutOptions: { "elk.port.side": side },
			});
		}
	}

	const layoutOptions: LayoutOptions = { "elk.portConstraints": "FIXED_POS" };
	if (isStart) {
		layoutOptions["elk.layered.layering.layerConstraint"] = "FIRST";
	}

	return { id: node.id, width, height, ports, layoutOptions };
}

function getEndpointId(
	nodeId: string,
	side: string,
	handleId: string | null | undefined,
	portIds: Set<string>,
) {
	if (handleId == null) return nodeId;
	const id = getPortId(nodeId, side, handleId);
	return portIds.has(id) ? id : nodeId;
}

export async function layoutWorkflowNodes(
	nodes: WorkflowCanvasNode[],
	edges: Edge[],
	getInternalNode?: (
		id: string,
	) => InternalNode<WorkflowCanvasNode> | undefined,
): Promise<WorkflowCanvasNode[]> {
	const firstNode = nodes[0];
	if (!firstNode) return nodes;

	const nodeIds = new Set(nodes.map((node) => node.id));
	const connections = edges.filter(
		(edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
	);
	const incomingIds = new Set(connections.map((edge) => edge.target));
	const startNodes = nodes.filter(
		(node) => node.data.type === "trigger" || !incomingIds.has(node.id),
	);
	const startIds = new Set(startNodes.map((node) => node.id));
	const layoutNodes = nodes.map((node) => {
		const internalNode = getInternalNode?.(node.id);
		return createLayoutNode(node, startIds.has(node.id), internalNode);
	});
	layoutNodes.sort((a, b) => {
		const aIsStart = startIds.has(a.id);
		const bIsStart = startIds.has(b.id);
		return Number(bIsStart) - Number(aIsStart);
	});

	const ports = layoutNodes.flatMap((node) => node.ports ?? []);
	const portIds = new Set(ports.map((port) => port.id));
	const layoutEdges = connections.map((edge) => {
		const sourceId = getEndpointId(
			edge.source,
			"EAST",
			edge.sourceHandle,
			portIds,
		);
		const targetId = getEndpointId(
			edge.target,
			"WEST",
			edge.targetHandle,
			portIds,
		);
		return { id: edge.id, sources: [sourceId], targets: [targetId] };
	});
	const graph: ElkNode = {
		id: "workflow",
		layoutOptions: WORKFLOW_LAYOUT_OPTIONS,
		children: layoutNodes,
		edges: layoutEdges,
	};
	const elk = new ELK();
	const layout = await elk.layout(graph);
	const positionedNodes = layout.children ?? [];
	const positions = new Map(positionedNodes.map((node) => [node.id, node]));
	const triggerNode = nodes.find((node) => node.data.type === "trigger");
	const anchor = triggerNode ?? startNodes[0] ?? firstNode;
	const anchorPosition = positions.get(anchor.id);
	const offsetX = anchor.position.x - (anchorPosition?.x ?? 0);
	const offsetY = anchor.position.y - (anchorPosition?.y ?? 0);
	return nodes.map((node) => {
		const position = positions.get(node.id);
		if (!position) return node;
		const x = Math.round((position.x ?? 0) + offsetX);
		const y = Math.round((position.y ?? 0) + offsetY);
		return { ...node, position: { x, y } };
	});
}
