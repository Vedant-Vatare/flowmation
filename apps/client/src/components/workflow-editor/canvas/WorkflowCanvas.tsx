import { LayoutProvider } from "@jalez/react-flow-automated-layout";
import { useQueryClient } from "@tanstack/react-query";
import type { Connection, Edge } from "@xyflow/react";
import { useNodes, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import type { WorkflowNode as WorkflowNodeRecord } from "@nodebase/shared";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useCanvasHistoryRecorder } from "@/hooks/useCanvasHistoryRecorder";
import {
	useAddWorkflowConn,
	useAddWorkflowNode,
	useDeleteWorkflowConn,
	useDeleteWorkflowNode,
	useUpdateNodesPositions,
	useUpdateWorkflowConn,
	useWorkflowConnectionsQuery,
	useWorkflowNodesQuery,
	workflowNodesOptions,
} from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import { useWorkflowSidbarTabsStore } from "@/store/workflow/useWorkflowEditor";
import {
	useWorkflowStore,
	useWorkflowTriggerStore,
} from "@/store/workflow/useWorkflowStore";
import {
	getUniqueNodeName,
	toCanvasEdges,
	toCanvasNodes,
} from "@/utils/nodes/nodes.utils";
import { resolveCollisions } from "@/utils/resolve-collisions";
import { TestWebhook } from "../TestWebhook";
import { FlowCanvas } from "./FlowCanvas";
import { NodeContextMenu } from "./NodeContextMenu";
import { WorkflowControls } from "./WorkflowControls";

const WorkflowCanvas = () => {
	const { workflowId } = Route.useParams();
	const { data: workflowNodes, isLoading: nodesLoading } =
		useWorkflowNodesQuery(workflowId);
	const { data: workflowConnections, isLoading: connectionsLoading } =
		useWorkflowConnectionsQuery(workflowId);
	const { mutateAsync: deleteNode } = useDeleteWorkflowNode();
	const { mutate: createNewConnection } = useAddWorkflowConn();
	const { mutate: updateConnection } = useUpdateWorkflowConn();
	const { mutateAsync: deleteConnection } = useDeleteWorkflowConn();
	const { mutate: updateNodesPositions } = useUpdateNodesPositions();
	const queryClient = useQueryClient();
	const { mutate: addNode, isPending: addingNode } = useAddWorkflowNode();
	const [clipboard, setClipboard] = useState<WorkflowNodeRecord | null>(null);
	const [menu, setMenu] = useState<{
		x: number;
		y: number;
		nodeId?: string;
		connectionId?: string;
	} | null>(null);

	useCanvasHistoryRecorder(workflowId);

	const {
		fitView,
		getNodes,
		setNodes,
		setEdges,
		deleteElements,
		screenToFlowPosition,
	} = useReactFlow<WorkflowCanvasNode>();
	const nodes = useNodes();

	const triggerFocusRequestKey = useWorkflowTriggerStore(
		(s) => s.triggerFocusRequestKey,
	);

	useEffect(() => {
		if (!workflowNodes) return;
		setNodes(toCanvasNodes(workflowNodes));
	}, [workflowNodes, setNodes]);

	useEffect(() => {
		if (!workflowConnections) return;
		setEdges(toCanvasEdges(workflowConnections));
	}, [workflowConnections, setEdges]);

	const canvasNodes = workflowNodes ? toCanvasNodes(workflowNodes) : [];
	const canvasEdges = workflowConnections
		? toCanvasEdges(workflowConnections)
		: [];

	useEffect(() => {
		if (!triggerFocusRequestKey) return;
		const triggerIds = nodes
			.filter((node) => node.data.type === "trigger")
			.map((node) => node.id);

		if (triggerIds.length === 0) return;

		fitView({
			nodes: triggerIds.map((id) => ({ id })),
			padding: 0.75,
			duration: 250,
			minZoom: 1,
			maxZoom: 1,
		});
	}, [triggerFocusRequestKey, nodes, fitView]);

	const handleNodeClick = (node: WorkflowCanvasNode) => {
		useWorkflowSidbarTabsStore.getState().setSidebarOpen(true);
		useWorkflowStore.getState().setSelectedNodeId(node.id);
		useWorkflowSidbarTabsStore.getState().setTabOpen("editor");
	};

	const isConnectionChanged = useCallback(
		(oldEdge: Edge, newConnection: Connection) => {
			return !(
				oldEdge.source === newConnection.source &&
				oldEdge.sourceHandle === newConnection.sourceHandle &&
				oldEdge.target === newConnection.target &&
				oldEdge.targetHandle === newConnection.targetHandle
			);
		},
		[],
	);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (!connection.sourceHandle || !connection.targetHandle) return;
			createNewConnection({
				id: crypto.randomUUID(),
				workflowId,
				sourceId: connection.source,
				targetId: connection.target,
				sourcePort: connection.sourceHandle,
				targetPort: connection.targetHandle,
			});
		},
		[createNewConnection, workflowId],
	);

	const onReconnect = useCallback(
		(oldEdge: Edge, newConnection: Connection) => {
			if (
				!isConnectionChanged(oldEdge, newConnection) ||
				!newConnection.sourceHandle ||
				!newConnection.targetHandle
			)
				return;

			updateConnection({
				id: oldEdge.id,
				workflowId,
				sourceId: newConnection.source,
				targetId: newConnection.target,
				sourcePort: newConnection.sourceHandle,
				targetPort: newConnection.targetHandle,
			});
		},
		[isConnectionChanged, workflowId, updateConnection],
	);

	const deleting = useRef(false);
	const onBeforeDelete = useCallback(
		async ({
			nodes: deletedNodes,
			edges: deletedEdges,
		}: {
			nodes: WorkflowCanvasNode[];
			edges: Edge[];
		}) => {
			if (deleting.current) return false;
			deleting.current = true;
			try {
				const nodeIds = new Set(deletedNodes.map((node) => node.id));
				const results = await Promise.allSettled([
					...deletedNodes.map(async ({ id }) => {
						await deleteNode({ id, workflowId });
						const selection = useWorkflowStore.getState();
						selection.clearNodeDraft(id);
						if (selection.selectedNodeId === id)
							selection.setSelectedNodeId(null);
					}),
					...deletedEdges
						.filter(
							(edge) => !nodeIds.has(edge.source) && !nodeIds.has(edge.target),
						)
						.map(({ id }) => deleteConnection({ id, workflowId })),
				]);
				if (results.some((result) => result.status === "rejected"))
					toast.error("Some items could not be deleted");
			} finally {
				deleting.current = false;
			}
			return false;
		},
		[deleteConnection, deleteNode, workflowId],
	);

	const onNodeDragStop = useCallback(
		(_e: React.MouseEvent, _draggedNode: WorkflowCanvasNode) => {
			const currentNodes = getNodes();

			const resolvedPositions = resolveCollisions([...currentNodes], {
				maxIterations: 50,
				overlapThreshold: 0.5,
				margin: 20,
			});

			setNodes(resolvedPositions);

			const cachedNodes = queryClient.getQueryData<WorkflowNodeRecord[]>(
				workflowNodesOptions(workflowId).queryKey,
			);
			if (!cachedNodes) return;

			const cachedMap = new Map(cachedNodes.map((n) => [n.id, n]));

			const nodesToUpdate = resolvedPositions
				.filter((n) => {
					const cached = cachedMap.get(n.id);
					if (!cached) return false;
					return (
						Math.round(n.position.x) !== cached.positionX ||
						Math.round(n.position.y) !== cached.positionY
					);
				})
				.map((n) => ({
					id: n.id,
					positionX: Math.round(n.position.x),
					positionY: Math.round(n.position.y),
				}));

			if (nodesToUpdate.length > 0) {
				updateNodesPositions({ workflowId, nodes: nodesToUpdate });
			}
		},
		[updateNodesPositions, workflowId, setNodes, getNodes, queryClient],
	);

	const menuNode = menu?.nodeId
		? getNodes().find((node) => node.id === menu.nodeId)
		: undefined;
	const savedNode = workflowNodes?.find((node) => node.id === menuNode?.id);
	const copiedNode = clipboard?.workflowId === workflowId ? clipboard : null;

	const insertCopy = (
		source: WorkflowNodeRecord,
		position: { x: number; y: number },
	) => {
		const currentNodes = getNodes();
		addNode(
			{
				...source,
				id: crypto.randomUUID(),
				workflowId,
				name: getUniqueNodeName(source.name, currentNodes),
				positionX: Math.round(position.x),
				positionY: Math.round(position.y),
			},
			{
				onError: () => toast.error("Could not add node"),
			},
		);
	};

	const placeNode = (
		point: { x: number; y: number },
		connectionId?: string,
	) => {
		const sidebar = useWorkflowSidbarTabsStore.getState();
		sidebar.setPlacement({
			workflowId,
			position: screenToFlowPosition(point),
			connectionId,
		});
		sidebar.setSidebarOpen(true);
		sidebar.setTabOpen("nodes");
	};

	if (nodesLoading || connectionsLoading) {
		return <Loader fullPage={false} />;
	}

	return (
		<FlowCanvas
			nodes={canvasNodes}
			edges={canvasEdges}
			onNodeClick={(_e, node) => handleNodeClick(node)}
			onNodeContextMenu={(event, node) => {
				event.preventDefault();
				setMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
			}}
			onEdgeContextMenu={(event, edge) => {
				event.preventDefault();
				setMenu({ x: event.clientX, y: event.clientY, connectionId: edge.id });
			}}
			onPaneContextMenu={(event) => {
				event.preventDefault();
				setMenu({ x: event.clientX, y: event.clientY });
			}}
			onBeforeDelete={onBeforeDelete}
			onNodeDragStop={onNodeDragStop}
			onConnect={onConnect}
			onReconnect={onReconnect}
		>
			<WorkflowControls />
			{menu && (
				<NodeContextMenu
					position={menu}
					onAdd={
						!menu.nodeId ? () => placeNode(menu, menu.connectionId) : undefined
					}
					addLabel={menu.connectionId ? "Insert node" : "Add node here"}
					onFit={
						!menu.nodeId && !menu.connectionId
							? () => void fitView({ padding: 0.2, duration: 250 })
							: undefined
					}
					deleteLabel={menu.connectionId ? "Delete connection" : "Delete node"}
					nodeName={menuNode?.data.name}
					addingNode={addingNode}
					onClose={() => setMenu(null)}
					onEdit={menuNode ? () => handleNodeClick(menuNode) : undefined}
					onCopy={
						savedNode
							? () => {
									setClipboard(structuredClone(savedNode));
									toast.success("Node copied");
								}
							: undefined
					}
					onDuplicate={
						savedNode && menuNode
							? () =>
									insertCopy(savedNode, {
										x: menuNode.position.x + 180,
										y: menuNode.position.y + 24,
									})
							: undefined
					}
					onPaste={
						copiedNode && !menu.connectionId
							? () =>
									insertCopy(
										copiedNode,
										menuNode
											? {
													x: menuNode.position.x + 180,
													y: menuNode.position.y + 24,
												}
											: screenToFlowPosition({ x: menu.x, y: menu.y }),
									)
							: undefined
					}
					onDelete={
						menuNode
							? () => void deleteElements({ nodes: [{ id: menuNode.id }] })
							: menu.connectionId
								? () =>
										void deleteElements({
											edges: [{ id: menu.connectionId as string }],
										})
								: undefined
					}
				/>
			)}
		</FlowCanvas>
	);
};

const WorkflowCanvasLayout = () => {
	const { workflowId } = Route.useParams();
	return (
		<div style={{ width: "100%", height: "100%" }}>
			<LayoutProvider
				initialDirection="RIGHT"
				initialAutoLayout={false}
				initialNodeDimensions={{ width: 100, height: 76 }}
			>
				<TestWebhook />
				<WorkflowCanvas key={workflowId} />
			</LayoutProvider>
		</div>
	);
};

export default WorkflowCanvasLayout;
