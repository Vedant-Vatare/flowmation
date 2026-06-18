import {
	DashboardSquare01Icon,
	DiscoverCircleIcon,
	PanelLeftIcon,
	Rocket01Icon,
	Settings01Icon,
	TimelineListIcon,
	Workflow,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Background,
	type EdgeTypes,
	MarkerType,
	MiniMap,
	type NodeTypes,
	ReactFlow,
	useEdgesState,
	useNodesState,
	useReactFlow,
	useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minus, Play, Plus, Waypoints } from "lucide-react";
import BrandIcon from "@/assets/icons/flowmation_temp.svg";
import { WorkflowEdge } from "@/components/workflow-editor/canvas/WorkflowEdge";
import { WorkflowNode } from "@/components/workflow-editor/canvas/WorkflowNodes";
import {
	DEFAULT_UI,
	NODE_UI_REGISTRY,
	type NodeUI,
	type WorkflowCanvasNode,
	type WorkflowNodeData,
} from "@/constants/nodes";

const nodeTypes: NodeTypes = {
	workflowNode: WorkflowNode,
};

const edgeTypes: EdgeTypes = {
	workflow: WorkflowEdge,
};

function createMockNode(
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

const PANEL_NODES: WorkflowCanvasNode[] = [
	createMockNode(
		"webhook-1",
		"trigger.webhook",
		"Webhook",
		"trigger",
		{ x: 50, y: 150 },
		[],
		[{ name: "output", label: "Output" }],
	),
	createMockNode(
		"click-1",
		"action.click",
		"Click",
		"action",
		{ x: 50, y: 320 },
		[],
		[{ name: "output", label: "Output" }],
	),
	createMockNode(
		"gmail-1",
		"action.gmail",
		"Gmail",
		"action",
		{ x: 340, y: 230 },
		[{ name: "input", label: "Input" }],
		[{ name: "output", label: "Output" }],
	),
	createMockNode(
		"slack-1",
		"action.slack",
		"Slack",
		"action",
		{ x: 610, y: 230 },
		[{ name: "input", label: "Input" }],
		[],
	),
];

const PANEL_EDGES = [
	{
		id: "e-webhook-gmail",
		source: "webhook-1",
		target: "gmail-1",
		sourceHandle: "output",
		targetHandle: "input",
		type: "workflow",
		markerEnd: { type: MarkerType.ArrowClosed },
		style: { strokeWidth: 2, stroke: "var(--muted-foreground)" },
	},
	{
		id: "e-click-gmail",
		source: "click-1",
		target: "gmail-1",
		sourceHandle: "output",
		targetHandle: "input",
		type: "workflow",
		markerEnd: { type: MarkerType.ArrowClosed },
		style: { strokeWidth: 2, stroke: "var(--muted-foreground)" },
	},
	{
		id: "e-gmail-slack",
		source: "gmail-1",
		target: "slack-1",
		sourceHandle: "output",
		targetHandle: "input",
		type: "workflow",
		markerEnd: { type: MarkerType.ArrowClosed },
		style: { strokeWidth: 2, stroke: "var(--muted-foreground)" },
	},
];

function CanvasControls() {
	const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
	const viewport = useViewport();
	const zoom = Math.round((viewport.zoom || 1) * 100);

	return (
		<div className="absolute bottom-7 left-1/2 z-5 -translate-x-1/2">
			<div className="flex items-center gap-3">
				<div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-sidebar-accent px-1.5 py-1">
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => zoomOut()}
						title="Zoom out"
					>
						<Minus size={16} strokeWidth={2} />
					</button>
					<button
						type="button"
						className="wf-control-btn min-w-10 cursor-pointer rounded px-1 text-[0.8125rem] font-medium text-foreground border-none bg-transparent"
						onClick={() =>
							setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 })
						}
						title="Reset zoom to 100%"
					>
						{zoom}
					</button>
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => zoomIn()}
						title="Zoom in"
					>
						<Plus size={16} strokeWidth={2} />
					</button>
					<div className="mx-0.5 h-4 w-px bg-border" />
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => fitView({ padding: 0.3, duration: 250 })}
						title="Fit view"
					>
						<Maximize2 size={15} strokeWidth={2} />
					</button>
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => fitView({ padding: 0.3, duration: 250 })}
						title="Auto layout"
					>
						<Waypoints size={15} strokeWidth={2} />
					</button>
				</div>
				<button
					type="button"
					className="inline-flex items-center gap-2 rounded-[calc(0.5rem-1.5px)] border border-primary/20 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 text-xs font-medium cursor-pointer"
				>
					<Play size={14} strokeWidth={2} className="text-primary" />
					Test Workflow
				</button>
			</div>
		</div>
	);
}

export function HeroPanel() {
	const [nodes, , onNodesChange] = useNodesState(PANEL_NODES);
	const [edges, , onEdgesChange] = useEdgesState(PANEL_EDGES);

	return (
		<div className="mx-auto max-w-[90vw] min-w-225 relative">
			<div
				className="rounded-xl border border-border bg-card overflow-hidden"
				style={{ boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)" }}
			>
				<div
					className="flex"
					style={{ minHeight: 720, height: "clamp(720px, 75vh, 720px)" }}
				>
					<div
						className="shrink-0 flex flex-col border-r border-border bg-sidebar"
						style={{ width: 256 }}
					>
						<div className="flex items-center gap-2 px-4 py-3 border-b border-border">
							<div className="flex items-center gap-2">
								<img
									src={BrandIcon}
									alt="flowmation logo"
									className="h-7 w-7"
								/>
								<span className="text-md font-medium text-foreground">
									Flowmation
								</span>
							</div>
						</div>

						<div className="flex-1 overflow-hidden px-2 py-3">
							<div
								className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1.5"
								style={{ letterSpacing: "0.05em" }}
							>
								Menu
							</div>
							<div className="space-y-0.5">
								<div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground">
									<HugeiconsIcon
										icon={DashboardSquare01Icon}
										strokeWidth={2}
										className="size-4"
									/>
									<span>Dashboard</span>
								</div>
								<div>
									<div
										className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm"
										style={{
											background: "var(--accent)",
											color: "var(--foreground)",
											fontWeight: 500,
										}}
									>
										<HugeiconsIcon
											icon={Workflow}
											strokeWidth={2}
											className="size-4"
										/>
										<span>Workflows</span>
										<svg
											aria-hidden="true"
											className="ml-auto shrink-0"
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M9 18l6-6-6-6" />
										</svg>
									</div>
									<div className="ml-6 mt-0.5 space-y-0.5 border-l-2 border-accent pl-2">
										<div
											className="text-xs px-1.5 py-1 rounded font-medium"
											style={{ color: "var(--foreground)" }}
										>
											Email Automation
										</div>
										<div className="text-xs px-1.5 py-1 rounded text-muted-foreground">
											Slack Notifier
										</div>
										<div className="text-xs px-1.5 py-1 rounded text-muted-foreground">
											Data Sync
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="border-t border-border px-2 py-2 space-y-0.5">
							<div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground">
								<HugeiconsIcon
									icon={TimelineListIcon}
									strokeWidth={2}
									className="size-4"
								/>
								<span>Logs</span>
							</div>
							<div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground">
								<HugeiconsIcon
									icon={DiscoverCircleIcon}
									strokeWidth={2}
									className="size-4"
								/>
								<span>Templates</span>
							</div>
							<div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground">
								<HugeiconsIcon
									icon={Settings01Icon}
									strokeWidth={2}
									className="size-4"
								/>
								<span>Settings</span>
							</div>

							<div className="flex items-center gap-2.5 px-2 py-2 mt-1 border-t border-border pt-2">
								<div
									className="flex items-center justify-center rounded-lg text-xs font-semibold"
									style={{
										width: 28,
										height: 28,
										background: "oklch(0.9 0.05 285)",
										color: "oklch(0.5 0.2 285)",
									}}
								>
									JD
								</div>
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-medium text-foreground truncate">
										Jane Doe
									</span>
									<span className="text-xs text-muted-foreground truncate">
										jane@example.com
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="flex-1 flex flex-col min-w-0">
						<header
							className="flex items-center justify-between gap-2 border-b border-border px-4 shrink-0"
							style={{ height: 44 }}
						>
							<div className="flex items-center gap-3">
								<button
									type="button"
									className="text-muted-foreground hover:text-foreground transition-colors"
								>
									<HugeiconsIcon
										icon={PanelLeftIcon}
										strokeWidth={2}
										className="size-4"
									/>
								</button>
								<div
									className="px-2.5 py-1 rounded-md text-sm tracking-wide"
									style={{ background: "var(--accent)" }}
								>
									Email Automation
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity min-w-30"
								>
									<HugeiconsIcon icon={Rocket01Icon} className="size-3.5" />
									Publish
								</button>
							</div>
						</header>

						<div className="flex-1 flex min-h-0">
							<div className="flex-1 relative min-w-0">
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
							</div>
							<div
								className="shrink-0 border-l border-border bg-sidebar flex flex-col"
								style={{ width: 240 }}
							>
								<div className="flex gap-1 px-2 pt-3 pb-1.5 border-b border-border">
									{(["Nodes", "Editor", "Runs"] as const).map((tab, i) => (
										<button
											key={tab}
											type="button"
											className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
											style={{
												background: i === 0 ? "var(--accent)" : "transparent",
												color:
													i === 0
														? "var(--foreground)"
														: "var(--muted-foreground)",
											}}
										>
											{tab}
										</button>
									))}
								</div>
								<div className="flex-1 overflow-hidden px-2 py-2">
									<div className="space-y-1">
										{PANEL_NODES.map((node) => {
											const data = node.data as WorkflowNodeData;
											const Icon = data.ui.icon;
											return (
												<div
													key={node.id}
													className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-background transition-colors text-sm tracking-tight"
												>
													<div
														className="size-6 p-0.5 rounded-sm shrink-0 flex items-center justify-center"
														style={{
															background: data.ui.background ?? "#21212A",
														}}
													>
														{data.ui.branded ? (
															<Icon className="size-5 rounded-sm shrink-0" />
														) : (
															<Icon
																className="size-5 p-0.5 rounded-sm shrink-0"
																style={{
																	color: data.ui.color ?? "currentColor",
																}}
															/>
														)}
													</div>
													<span className="capitalize">{data.name}</span>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				className="absolute inset-y-0 right-0 w-32 pointer-events-none z-10"
				style={{
					background: "linear-gradient(to right, transparent, black)",
				}}
			/>
		</div>
	);
}
