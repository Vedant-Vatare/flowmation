import {
	addEdge,
	Background,
	ConnectionMode,
	Controls,
	Handle,
	MarkerType,
	MiniMap,
	type Node,
	type NodeProps,
	type NodeTypes,
	Position,
	ReactFlow,
	reconnectEdge,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import type React from "react";
import { useCallback } from "react";
import ClickIcon from "@/assets/icons/nodes/click.svg?react";
import ConditionalIcon from "@/assets/icons/nodes/conditional.svg?react";
import GoogleIcon from "@/assets/icons/nodes/google.svg?react";
import SetVarIcon from "@/assets/icons/nodes/set-var.svg?react";
import WaitIcon from "@/assets/icons/nodes/wait.svg?react";
import "@xyflow/react/dist/style.css";

import { Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import HTTPIcon from "@/assets/icons/nodes/http.svg?react";
import type {
	NodeUI,
	WorkflowCanvasNode,
	WorkflowNodeData,
} from "@/constants/nodes";
import { withAlpha } from "@/utils/colors";

const WorkflowNode = ({
	data,
	selected,
}: NodeProps<Node<WorkflowNodeData>>) => {
	const ui = data.ui as NodeUI;
	const name = data.name as string;
	const Icon = ui.icon;
	const bg = withAlpha(ui.background ?? "#6366f1", 0.2);
	const border = ui.background ?? "#6366f1";

	return (
		<div
			style={{
				background: bg,
				borderColor: selected ? "#ffffff" : withAlpha(border, 0.4),
			}}
			className="group relative min-w-32 h-28 max-w-max rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 border-2 hover:scale-105"
		>
			{data.inputPorts?.map((port, i) => (
				<Handle
					key={port.name}
					id={port.name}
					type="target"
					position={Position.Left}
					style={{
						top: `${((i + 1) / (data.inputPorts.length + 1)) * 100}%`,
						height: 7,
						width: 7,
						background: "var(--background)",
						border: `2px solid ${withAlpha(border, 0.8)}`,
						borderRadius: "50%",
						transition: "transform 0.15s",
					}}
					className="hover:scale-105"
				/>
			))}

			<div
				style={{
					background: withAlpha(border, 0.15),
					border: `1px solid ${withAlpha(border, 0.3)}`,
				}}
				className="w-10 h-10 rounded-lg flex items-center justify-center"
			>
				<Icon className="text-primary-foreground w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
			</div>
			<span
				style={{ color: "var(--foreground)" }}
				className="text-xs font-bold text-center leading-tight px-1"
			>
				{name}
			</span>

			{data.outputPorts?.map((port, i) => (
				<Handle
					key={port.name}
					id={port.name}
					type="source"
					position={Position.Right}
					style={{
						top: `${((i + 1) / (data.outputPorts.length + 1)) * 100}%`,
						height: 7,
						width: 7,
						borderColor: border,
						borderRadius: "50%",
						cursor: "crosshair",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 10,
						transition: "transform 0.15s, box-shadow 0.15s",
						boxShadow: `0 0 6px ${withAlpha(border, 0.5)}`,
					}}
					className="hidden group-hover:block"
				>
					<span className="text-accent text-xs pointer-events-none h-16 w-16 p-1  object-cover select-none font-bold">
						<HugeiconsIcon icon={Plus} className="h-full w-full" />
					</span>
				</Handle>
			))}

			{data.outputPorts?.length > 1 &&
				data.outputPorts.map((port, i) => (
					<div
						key={port.name}
						style={{
							top: `${((i + 1) / (data.outputPorts.length + 1)) * 100}%`,
							right: "-50%",
							transform: "translateY(-50%)",
							background: withAlpha(border, 0.15),
							border: `1px solid ${withAlpha(border, 0.3)}`,
							color: border,
						}}
						className="absolute text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
					>
						{port.label}
					</div>
				))}
		</div>
	);
};

const nodeTypes: NodeTypes = {
	workflowNode: WorkflowNode,
};

const initialNodes: WorkflowCanvasNode[] = [
	{
		id: "1",
		type: "workflowNode",
		position: { x: 100, y: 100 },
		data: {
			name: "Click",
			task: "event.click",
			type: "trigger",
			parameters: [],
			workflowId: "wf-1",
			nodeId: "node-1",
			instanceId: "inst-1",
			positionX: 100,
			positionY: 100,
			settings: {},
			inputPorts: [],
			outputPorts: [{ name: "out", label: "Output" }],
			ui: {
				name: "Click",
				type: "event.click",
				icon: ClickIcon,
				background: "#0496ff",
				color: "#ffffff",
			},
		},
	},
	{
		id: "2",
		type: "workflowNode",
		position: { x: 300, y: 100 },
		data: {
			name: "HTTP Request",
			task: "action.http",
			type: "action",
			parameters: [],
			workflowId: "wf-1",
			nodeId: "node-2",
			instanceId: "inst-2",
			positionX: 300,
			positionY: 100,
			settings: {},
			inputPorts: [{ name: "in", label: "Input" }],
			outputPorts: [{ name: "out", label: "Output" }],
			ui: {
				name: "HTTP Request",
				type: "action.http",
				icon: HTTPIcon,
				background: "#736ced",
				color: "#ffffff",
			},
		},
	},
	{
		id: "3",
		type: "workflowNode",
		position: { x: 500, y: 0 },
		data: {
			name: "Google",
			task: "action.google.search",
			type: "action",
			parameters: [],
			workflowId: "wf-1",
			nodeId: "node-3",
			instanceId: "inst-3",
			positionX: 500,
			positionY: 0,
			settings: {},
			inputPorts: [{ name: "in", label: "Input" }],
			outputPorts: [{ name: "out", label: "Output" }],
			ui: {
				name: "Google",
				type: "action.google.search",
				icon: GoogleIcon,
				background: "linear-gradient(135deg, red, blue)",
				color: "#ffffff",
			},
		},
	},
	{
		id: "4",
		type: "workflowNode",
		position: { x: 500, y: 200 },
		data: {
			name: "Set Variable",
			task: "action.set_variable",
			type: "action",
			parameters: [],
			workflowId: "wf-1",
			nodeId: "node-4",
			instanceId: "inst-4",
			positionX: 500,
			positionY: 200,
			settings: {},
			inputPorts: [{ name: "in", label: "Input" }],
			outputPorts: [{ name: "out", label: "Output" }],
			ui: {
				name: "Set Variable",
				type: "action.set_variable",
				icon: SetVarIcon,
				background: "#119da4",
				color: "#ffffff",
			},
		},
	},
	{
		id: "5",
		type: "workflowNode",
		position: { x: 700, y: 100 },
		data: {
			name: "Condition",
			task: "control.condition",
			type: "action",
			parameters: [],
			workflowId: "wf-1",
			nodeId: "node-5",
			instanceId: "inst-5",
			positionX: 700,
			positionY: 100,
			settings: {},
			inputPorts: [{ name: "in", label: "Input" }],
			outputPorts: [
				{ name: "true", label: "True" },
				{ name: "false", label: "False" },
			],
			ui: {
				name: "Condition",
				type: "control.condition",
				icon: ConditionalIcon,
				background: "#8338EC",
				color: "#ffffff",
			},
		},
	},
	{
		id: "6",
		type: "workflowNode",
		position: { x: 900, y: 100 },
		data: {
			name: "Wait",
			task: "event.wait",
			type: "trigger",
			parameters: [],
			workflowId: "wf-1",
			nodeId: "node-6",
			instanceId: "inst-6",
			positionX: 900,
			positionY: 100,
			settings: {},
			inputPorts: [{ name: "in", label: "Input" }],
			outputPorts: [{ name: "out", label: "Output" }],
			ui: {
				name: "Wait",
				type: "event.wait",
				icon: WaitIcon,
				background: "#FF9F1C",
				color: "#ffffff",
			},
		},
	},
];

const initialEdges = [
	{ id: "e1-2", source: "1", target: "2" },
	{ id: "e2-3", source: "2", target: "3" },
	{ id: "e2-4", source: "2", target: "4" },
	{ id: "e3-5", source: "3", target: "5" },
	{ id: "e4-5", source: "4", target: "5" },
	{ id: "e5-6", source: "5", target: "6" },
];
const WorkflowCanvas = () => {
	const [nodes, _setNodes, onNodesChange] =
		useNodesState<WorkflowCanvasNode>(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect = useCallback(
		(params: any) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	return (
		<div style={{ width: "100%", height: "100%" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				fitView
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onReconnect={(oldEdge, newConnection) => {
					setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
				}}
				connectionMode={ConnectionMode.Strict}
				deleteKeyCode={"Delete"}
				defaultEdgeOptions={{
					markerEnd: { type: MarkerType.ArrowClosed },
					style: {
						strokeWidth: 2,
						stroke: "var(--muted-foreground)",
					},
				}}
			>
				<MiniMap
					style={{
						background: "hsl(var(--card))",
						border: "1px solid hsl(var(--border))",
						borderRadius: "12px",
					}}
					maskColor="hsl(var(--background) / 0.6)"
					nodeColor={(n) => {
						const ui = (n.data as WorkflowNodeData).ui as NodeUI;
						return ui?.background ?? "#6366f1";
					}}
				/>
				<div className="absolute bottom-0 left-0">
					<Controls
						orientation="horizontal"
						style={
							{
								bottom: "4rem",
								background: "transparent",
							} as React.CSSProperties
						}
					/>
				</div>
				<Background />
			</ReactFlow>
		</div>
	);
};

export default WorkflowCanvas;
