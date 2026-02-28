import { useReactFlow } from "@xyflow/react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import {
	ACTION_NODES,
	createCanvasNode,
	type NodeRegistryEntry,
	TRIGGER_NODES,
} from "@/constants/nodes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const NodeItem = ({
	nodeData,
	onClick,
}: {
	nodeData: NodeRegistryEntry;
	onClick: () => void;
}) => {
	const { ui } = nodeData;
	const Icon = ui.icon;

	return (
		<button
			type="button"
			className="flex gap-2 items-center w-full"
			onClick={onClick}
		>
			<Icon
				className="h-6 w-6 p-1 rounded-sm shrink-0"
				style={{
					color: ui.color ?? "currentColor",
					background: ui.background ?? "#21212A",
				}}
			/>
			<span>{ui.name}</span>
		</button>
	);
};

const Nodes = () => {
	const { addNodes, getNodes, fitView } = useReactFlow();

	const handleAddNode = (task: string) => {
		const nodes = getNodes();
		const last = nodes[nodes.length - 1];
		const position = last
			? { x: last.position.x + 200, y: last.position.y }
			: { x: 225, y: 225 };

		const node = createCanvasNode(task, position);
		addNodes(node);
		fitView({
			padding: 20,
			duration: 300,
		});
		// api call here too
		console.log("adding node");
	};
	return (
		<>
			<SidebarGroup>
				<SidebarGroupLabel>Triggers</SidebarGroupLabel>
				<SidebarMenu className="gap-1 text-sm tracking-tight [word-spacing:0.125rem]">
					{TRIGGER_NODES.map((entry: NodeRegistryEntry) => (
						<SidebarMenuItem
							key={entry.task}
							className="cursor-pointer hover:bg-background p-1.5 rounded-sm pl-2.5 transition-colors"
						>
							<NodeItem
								nodeData={entry}
								onClick={() => handleAddNode(entry.task)}
							/>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroup>

			<SidebarGroup>
				<SidebarGroupLabel>Actions</SidebarGroupLabel>
				<SidebarMenu className="text-sm gap-1 tracking-tight">
					{ACTION_NODES.map((entry: NodeRegistryEntry) => (
						<SidebarMenuItem
							key={entry.task}
							className="cursor-pointer hover:bg-background p-1.5 rounded-sm pl-2.5 transition-colors"
						>
							<NodeItem
								nodeData={entry}
								onClick={() => handleAddNode(entry.task)}
							/>
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
