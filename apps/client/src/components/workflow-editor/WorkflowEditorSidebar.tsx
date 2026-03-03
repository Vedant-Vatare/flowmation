import type { BaseNode } from "@nodebase/shared";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
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
import type { NodeUI } from "@/constants/nodes";
import { useSortedNodes } from "@/hooks/nodes";
import { useAddWorkflowNode } from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import {
	createCanvasNode,
	createWorkflowNode,
	getNodeUI,
} from "@/utils/nodes.utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

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
			<Icon
				className="h-6 w-6 p-1 rounded-sm shrink-0"
				style={{
					color: ui.color ?? "currentColor",
					background: ui.background ?? "#21212A",
				}}
			/>
			<span className="capitalize">{node.name}</span>
		</button>
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

const Nodes = () => {
	const { workflowId } = Route.useParams();
	const { addNodes, getNodes, fitView } = useReactFlow();
	const ALL_NODES = useSortedNodes();
	const { mutate } = useAddWorkflowNode();

	const handleAddNode = useCallback(
		(apiNode: BaseNode) => {
			const nodes = getNodes();
			const last = nodes[nodes.length - 1];
			const position = last
				? { x: last.position.x + 200, y: last.position.y }
				: { x: 225, y: 225 };

			const canvasNode = createCanvasNode({ apiNode, workflowId, position });
			addNodes(canvasNode);
			fitView({ padding: 20, duration: 300 });

			const workflowNodeData = createWorkflowNode(canvasNode);
			mutate(workflowNodeData);
		},
		[workflowId, addNodes, getNodes, fitView, mutate],
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
			<SidebarGroup>
				<SidebarGroupLabel>Triggers</SidebarGroupLabel>
				<SidebarMenu className="gap-1 text-sm tracking-tight [word-spacing:0.125rem]">
					{ALL_NODES.triggers.map((node) => (
						<SidebarMenuItem
							key={node.task}
							className="cursor-pointer hover:bg-background p-1.5 rounded-sm pl-2.5 transition-colors"
						>
							<NodeItem node={node} onClick={() => handleAddNode(node)} />
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroup>

			<SidebarGroup>
				<SidebarGroupLabel>Actions</SidebarGroupLabel>
				<SidebarMenu className="text-sm gap-1 tracking-tight">
					{ALL_NODES.actions.map((node) => (
						<SidebarMenuItem
							key={node.task}
							className="cursor-pointer hover:bg-background p-1.5 rounded-sm pl-2.5 transition-colors"
						>
							<NodeItem node={node} onClick={() => handleAddNode(node)} />
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroup>
		</>
	);
};

const NodeEditor = () => {
	return <p className="text-sm text-muted-foreground">Select a node to edit</p>;
};

export const WorkflowEditorSidebar = () => {
	return (
		<Sidebar side="right" collapsible="offcanvas" className="h-screen">
			<SidebarRail />
			<SidebarContent className="mt-10 pl-1">
				<Tabs defaultValue="nodes">
					<TabsList className="ml-2 px-2 py-1.5 gap-2 mb-1">
						<TabsTrigger value="nodes">Nodes</TabsTrigger>
						<TabsTrigger value="editor">Editor</TabsTrigger>
					</TabsList>
					<TabsContent value="nodes">
						<Nodes />
					</TabsContent>
					<TabsContent value="editor">
						<NodeEditor />
					</TabsContent>
				</Tabs>
			</SidebarContent>
		</Sidebar>
	);
};
