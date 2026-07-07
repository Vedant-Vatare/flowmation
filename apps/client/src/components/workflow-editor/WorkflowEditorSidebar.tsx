import type { BaseNode } from "@nodebase/shared";
import { useReactFlow } from "@xyflow/react";
import { SearchIcon, XIcon } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { NodeUI, WorkflowCanvasNode } from "@/constants/nodes";
import { useSortedNodes } from "@/hooks/nodes";
import { useAddWorkflowNode } from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import { useWorkflowSidbarTabsStore } from "@/store/workflow/useWorkflowEditor";
import { useWorkflowStore } from "@/store/workflow/useWorkflowStore";
import {
	createCanvasNode,
	createWorkflowNode,
	getNodeUI,
	getUniqueNodeName,
} from "@/utils/nodes/nodes.utils";
import { resolveCollisions } from "@/utils/resolve-collisions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NodeEditor } from "./node-editor/NodeEditor";
import { WorkflowLogs } from "./WorkflowLogs";

const NodeItem = ({
	node,
	onClick,
}: {
	node: BaseNode;
	onClick: () => void;
}) => {
	const ui: NodeUI = getNodeUI(node.task);
	const Icon = ui.icon;

	return (
		<button
			type="button"
			className="flex gap-2 items-center w-full cursor-pointer"
			onClick={onClick}
		>
			<div
				className="size-6 p-0.5 rounded-sm shrink-0 flex items-center justify-center"
				style={{ background: ui.iconBackground ?? ui.background }}
			>
				{ui.branded ? (
					<Icon className="size-5 rounded-sm shrink-0" />
				) : (
					<Icon
						className="size-5 p-0.5 rounded-sm shrink-0"
						style={{ color: ui.color ?? "currentColor" }}
					/>
				)}
			</div>
			<span className="capitalize">{node.name}</span>
		</button>
	);
};

const SearchNode = ({ onChange }: { onChange: (query: string) => void }) => {
	const [query, setQuery] = useState("");

	const handleChange = useCallback(
		(value: string) => {
			setQuery(value);
			onChange(value);
		},
		[onChange],
	);

	return (
		<div className="px-3 pb-2 group">
			<div className="relative">
				<SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none group-focus-within:text-foreground transition-colors" />
				<Input
					value={query}
					onChange={(e) => handleChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Escape") handleChange("");
					}}
					placeholder="Search nodes"
					className="h-8 pl-8 pr-7 text-sm rounded-[10px] bg-muted border-2 border-transparent shadow-none ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 hover:bg-secondary/60 focus-visible:bg-secondary/80 focus-visible:border-white/80 transition-colors"
				/>
				{query && (
					<button
						type="button"
						onClick={() => handleChange("")}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<XIcon className="size-3.5" />
					</button>
				)}
			</div>
		</div>
	);
};

const NodeGroupSkeleton = ({
	label,
	widths,
}: {
	label: string;
	widths: string[];
}) => (
	<SidebarGroup>
		<SidebarGroupLabel>{label}</SidebarGroupLabel>
		<SidebarMenu className="gap-1">
			{widths.map((w, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
				<SidebarMenuItem key={i} className="p-1.5 pl-2.5">
					<div className="flex gap-2 items-center w-full">
						<Skeleton className="h-6 w-6 rounded-sm shrink-0 opacity-40" />
						<Skeleton
							className="h-3.5 rounded-sm opacity-30"
							style={{ width: w }}
						/>
					</div>
				</SidebarMenuItem>
			))}
		</SidebarMenu>
	</SidebarGroup>
);

const Nodes = memo(() => {
	const { workflowId } = Route.useParams();
	const { getNodes, fitView, setNodes } = useReactFlow<WorkflowCanvasNode>();
	const ALL_NODES = useSortedNodes();
	const { mutate } = useAddWorkflowNode();
	const [query, setQuery] = useState("");

	const filteredNodes = useMemo(() => {
		if (!ALL_NODES) return { triggers: [], actions: [] };
		if (!query.trim()) return ALL_NODES;
		const q = query.toLowerCase();
		return {
			triggers: ALL_NODES.triggers.filter((n) =>
				n.name.toLowerCase().includes(q),
			),
			actions: ALL_NODES.actions.filter((n) =>
				n.name.toLowerCase().includes(q),
			),
		};
	}, [ALL_NODES, query]);

	const hasResults =
		filteredNodes.triggers.length > 0 || filteredNodes.actions.length > 0;

	const handleAddNode = useCallback(
		(apiNode: BaseNode) => {
			const nodes = getNodes();
			const last = nodes[nodes.length - 1];
			const position = last
				? { x: last.position.x + 200, y: last.position.y }
				: { x: 225, y: 225 };

			const uniqueNodeName = getUniqueNodeName(apiNode.name, nodes);

			const canvasNode = createCanvasNode({
				apiNode: { ...apiNode, name: uniqueNodeName },
				workflowId,
				position,
			});

			const resolvedNodes = resolveCollisions([...nodes, canvasNode], {
				maxIterations: 50,
				overlapThreshold: 0.5,
				margin: 20,
			});

			setNodes(resolvedNodes);
			fitView({ padding: 0.2, duration: 300 });

			const resolvedCanvasNode =
				resolvedNodes.find((n) => n.id === canvasNode.id) || canvasNode;
			const workflowNodeData = createWorkflowNode(resolvedCanvasNode);
			mutate(workflowNodeData);
		},
		[workflowId, getNodes, fitView, mutate, setNodes],
	);

	if (!ALL_NODES) {
		return (
			<>
				<NodeGroupSkeleton label="Triggers" widths={["62%", "78%", "55%"]} />
				<NodeGroupSkeleton
					label="Actions"
					widths={["70%", "58%", "82%", "65%", "74%"]}
				/>
			</>
		);
	}

	return (
		<>
			<SearchNode onChange={setQuery} />

			{filteredNodes.triggers.length > 0 && (
				<SidebarGroup>
					<SidebarGroupLabel>Triggers</SidebarGroupLabel>
					<SidebarMenu className="gap-1 text-sm tracking-tight [word-spacing:0.125rem]">
						{filteredNodes.triggers.map((node) => (
							<SidebarMenuItem
								key={node.task}
								className="cursor-pointer hover:bg-background p-1.5 rounded-sm pl-2.5 transition-colors"
							>
								<NodeItem node={node} onClick={() => handleAddNode(node)} />
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			)}

			{filteredNodes.actions.length > 0 && (
				<SidebarGroup>
					<SidebarGroupLabel>Actions</SidebarGroupLabel>
					<SidebarMenu className="text-sm gap-1 tracking-tight">
						{filteredNodes.actions.map((node) => (
							<SidebarMenuItem
								key={node.task}
								className="cursor-pointer hover:bg-background p-1.5 rounded-sm pl-2.5 transition-colors"
							>
								<NodeItem node={node} onClick={() => handleAddNode(node)} />
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			)}

			{!hasResults && (
				<p className="px-3 py-6 text-sm text-muted-foreground text-center">
					No nodes found
				</p>
			)}
		</>
	);
});

const NodeEditorTab = () => {
	const selectedNode = useWorkflowStore((s) => s.selectedNode);

	if (!selectedNode) {
		return (
			<p className="text-sm text-muted-foreground">Select a node to edit</p>
		);
	}

	if (!selectedNode) {
		return (
			<p className="text-sm text-muted-foreground">Select a node to edit</p>
		);
	}

	return <NodeEditor key={selectedNode.id} node={selectedNode} />;
};

export const WorkflowEditorSidebar = memo(() => {
	const tabOpen = useWorkflowSidbarTabsStore((s) => s.tabOpen);
	const setTabOpen = useWorkflowSidbarTabsStore((s) => s.setTabOpen);

	return (
		<Sidebar
			side="right"
			collapsible="offcanvas"
			className="top-(--main-header-height) h-(--main-content-level-height)"
		>
			<SidebarRail side="right" />
			<SidebarContent className="pt-5">
				<Tabs
					defaultValue="editor"
					value={tabOpen}
					className="flex flex-col flex-1 min-h-0"
				>
					<TabsList className="ml-2 px-2 py-1.5 gap-2 mb-1 shrink-0">
						<TabsTrigger value="nodes" onClick={() => setTabOpen("nodes")}>
							Nodes
						</TabsTrigger>
						<TabsTrigger value="editor" onClick={() => setTabOpen("editor")}>
							Editor
						</TabsTrigger>
						<TabsTrigger value="runs" onClick={() => setTabOpen("runs")}>
							Runs
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="nodes"
						className="flex-1 overflow-y-auto min-h-0 mt-0"
					>
						<Nodes />
					</TabsContent>
					<TabsContent
						value="editor"
						className="flex-1 overflow-y-auto min-h-0 mt-0 "
					>
						<NodeEditorTab />
					</TabsContent>
					<TabsContent
						value="runs"
						className="flex-1 overflow-y-auto min-h-0 mt-0"
					>
						<WorkflowLogs />
					</TabsContent>
				</Tabs>
			</SidebarContent>
		</Sidebar>
	);
});
