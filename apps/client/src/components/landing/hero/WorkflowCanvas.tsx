import type {
	Edge,
	EdgeChange,
	EdgeTypes,
	NodeChange,
	NodeTypes,
} from "@xyflow/react";
import { Background, MarkerType, MiniMap, ReactFlow } from "@xyflow/react";
import { WorkflowEdge } from "@/components/workflow-editor/canvas/WorkflowEdge";
import { WorkflowNode } from "@/components/workflow-editor/canvas/WorkflowNodes";
import type { WorkflowCanvasNode, WorkflowNodeData } from "@/constants/nodes";
import { CanvasControls } from "./CanvasControls";

const nodeTypes: NodeTypes = {
	workflowNode: WorkflowNode,
};

const edgeTypes: EdgeTypes = {
	workflow: WorkflowEdge,
};

type WorkflowCanvasProps = {
	nodes: WorkflowCanvasNode[];
	edges: Edge[];
	onNodesChange: (changes: NodeChange<WorkflowCanvasNode>[]) => void;
	onEdgesChange: (changes: EdgeChange[]) => void;
};

export function WorkflowCanvas({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
}: WorkflowCanvasProps) {
	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			proOptions={{ hideAttribution: true }}
			fitView
			fitViewOptions={{ padding: 0.3, duration: 0 }}
			maxZoom={2}
			minZoom={0.5}
			panOnDrag
			selectionOnDrag
			nodesDraggable
			nodesConnectable={false}
			elementsSelectable={false}
			defaultEdgeOptions={{
				markerEnd: { type: MarkerType.ArrowClosed },
				style: {
					strokeWidth: 2,
					stroke: "var(--muted-foreground)",
				},
			}}
			style={{ width: "100%", height: "100%" }}
		>
			<MiniMap
				style={{
					background: "hsl(var(--card))",
					border: "1px solid hsl(var(--border))",
					borderRadius: "12px",
					bottom: "1rem",
					right: "0.75rem",
				}}
				maskColor="hsl(var(--background) / 0.6)"
				nodeColor={(n) => {
					const data = n.data as WorkflowNodeData;
					return data.ui?.background ?? "#6366f1";
				}}
			/>
			<Background />
			<CanvasControls />
		</ReactFlow>
	);
}
