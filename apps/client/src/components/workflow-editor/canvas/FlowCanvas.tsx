import {
	Background,
	type Connection,
	ConnectionMode,
	type Edge,
	type EdgeTypes,
	MarkerType,
	MiniMap,
	type NodeTypes,
	type OnEdgesDelete,
	ReactFlow,
} from "@xyflow/react";
import type { CSSProperties, ReactNode } from "react";
import type { WorkflowCanvasNode, WorkflowNodeData } from "@/constants/nodes";
import { getNodeColorByTask } from "@/utils/nodes/nodes.utils";
import { WorkflowEdge } from "./WorkflowEdge";
import { WorkflowNode } from "./WorkflowNodes";

const nodeTypes: NodeTypes = {
	workflowNode: WorkflowNode,
};

const edgeTypes: EdgeTypes = {
	workflow: WorkflowEdge,
};

const defaultEdgeOptions = {
	markerEnd: { type: MarkerType.ArrowClosed },
	style: {
		strokeWidth: 2,
		stroke: "var(--muted-foreground)",
	},
};

const fitViewOptions = {
	duration: 250,
	padding: 0.75,
	minZoom: 1,
	maxZoom: 1,
};

export type FlowCanvasProps = {
	nodes: WorkflowCanvasNode[];
	edges: Edge[];
	editable?: boolean;
	fitView?: boolean;
	showMiniMap?: boolean;
	showBackground?: boolean;
	onNodeClick?: (event: React.MouseEvent, node: WorkflowCanvasNode) => void;
	onNodeDragStart?: (event: React.MouseEvent, node: WorkflowCanvasNode) => void;
	onNodeDragStop?: (event: React.MouseEvent, node: WorkflowCanvasNode) => void;
	onNodesDelete?: (nodes: WorkflowCanvasNode[]) => void;
	onEdgesDelete?: OnEdgesDelete<Edge>;
	onConnect?: (connection: Connection) => void;
	onReconnect?: (oldEdge: Edge, newConnection: Connection) => void;
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
};

export const FlowCanvas = ({
	nodes,
	edges,
	editable = true,
	fitView = false,
	showMiniMap = true,
	showBackground = true,
	onNodeClick,
	onNodeDragStart,
	onNodeDragStop,
	onNodesDelete,
	onEdgesDelete,
	onConnect,
	onReconnect,
	children,
	className,
	style,
}: FlowCanvasProps) => {
	const interactionOptions = editable
		? {
				panOnDrag: [1] as number[],
				selectionOnDrag: true,
			}
		: {
				panOnDrag: true,
				selectionOnDrag: false,
				nodesDraggable: false,
				nodesConnectable: false,
				elementsSelectable: false,
			};

	return (
		<ReactFlow
			defaultNodes={nodes}
			defaultEdges={edges}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			proOptions={{ hideAttribution: true }}
			fitView={fitView}
			fitViewOptions={fitViewOptions}
			maxZoom={2}
			minZoom={0.5}
			onNodeClick={onNodeClick}
			onNodeDragStart={onNodeDragStart}
			onNodesDelete={onNodesDelete}
			onNodeDragStop={onNodeDragStop}
			onEdgesDelete={onEdgesDelete}
			onConnect={onConnect}
			onReconnect={onReconnect}
			connectionRadius={20}
			connectionMode={ConnectionMode.Strict}
			deleteKeyCode="Delete"
			defaultEdgeOptions={defaultEdgeOptions}
			{...interactionOptions}
			className={className}
			style={style}
		>
			{showMiniMap ? (
				<MiniMap
					style={{
						background: "hsl(var(--card))",
						border: "1px solid hsl(var(--border))",
						borderRadius: "12px",
						bottom: "1rem",
						right: "0.75rem",
					}}
					maskColor="hsl(var(--background) / 0.6)"
					nodeColor={(n) =>
						getNodeColorByTask((n.data as WorkflowNodeData).task)
					}
				/>
			) : null}
			{showBackground ? <Background /> : null}
			{children}
		</ReactFlow>
	);
};
