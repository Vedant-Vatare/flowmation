import { LayoutProvider } from "@jalez/react-flow-automated-layout";
import { useQueryClient } from "@tanstack/react-query";
import type { Connection, Edge } from "@xyflow/react";
import { useNodes, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect } from "react";
import "@xyflow/react/dist/style.css";

import type { WorkflowNode as WorkflowNodeRecord } from "@nodebase/shared";
import Loader from "@/components/ui/Loader";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useDebounce } from "@/hooks/debounce";
import {
	useAddWorkflowConn,
	useDeleteWorkflowConn,
	useDeleteWorkflowNode,
	useUpdateNodesPositions,
	useUpdateWorkflowConn,
	useWorkflowConnectionsQuery,
	useWorkflowNodesQuery,
	workflowNodesOptions,
} from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import {
	captureSnapshot,
	useCanvasHistoryStore,
} from "@/store/workflow/useCanvasHistoryStore";
import { useWorkflowSidbarTabsStore } from "@/store/workflow/useWorkflowEditor";
import {
	useWorkflowStore,
	useWorkflowTriggerStore,
} from "@/store/workflow/useWorkflowStore";
import { toCanvasEdges, toCanvasNodes } from "@/utils/nodes/nodes.utils";
import { resolveCollisions } from "@/utils/resolve-collisions";
import { TestWebhook } from "../TestWebhook";
import { FlowCanvas } from "./FlowCanvas";
import { WorkflowControls } from "./WorkflowControls";

const WorkflowCanvas = () => {
	const { workflowId } = Route.useParams();
	const { data: workflowNodes, isLoading: nodesLoading } =
		useWorkflowNodesQuery(workflowId);
	const { data: workflowConnections, isLoading: connectionsLoading } =
		useWorkflowConnectionsQuery(workflowId);
	const { mutate: deleteNode } = useDeleteWorkflowNode();
	const { mutate: createNewConnection } = useAddWorkflowConn();
	const { mutate: updateConnection } = useUpdateWorkflowConn();
	const { mutate: deleteConnection } = useDeleteWorkflowConn();
	const { mutate: updateNodesPositions } = useUpdateNodesPositions();
	const queryClient = useQueryClient();

	const pushSnapshot = useCanvasHistoryStore((s) => s.pushSnapshot);
	const clearHistory = useCanvasHistoryStore((s) => s.clear);

	const { fitView, getNodes, getEdges, setNodes, setEdges } =
		useReactFlow<WorkflowCanvasNode>();
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

	useEffect(() => {
		clearHistory();
	}, [clearHistory]);

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
		useWorkflowStore.getState().setSelectedNode(node);
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
			pushSnapshot(captureSnapshot(getNodes(), getEdges()));
			createNewConnection({
				id: crypto.randomUUID(),
				workflowId,
				sourceId: connection.source,
				targetId: connection.target,
				sourcePort: connection.sourceHandle,
				targetPort: connection.targetHandle,
			});
		},
		[createNewConnection, workflowId, pushSnapshot, getNodes, getEdges],
	);

	const onReconnect = useCallback(
		(oldEdge: Edge, newConnection: Connection) => {
			if (
				!isConnectionChanged(oldEdge, newConnection) ||
				!newConnection.sourceHandle ||
				!newConnection.targetHandle
			)
				return;

			pushSnapshot(captureSnapshot(getNodes(), getEdges()));
			updateConnection({
				id: oldEdge.id,
				workflowId,
				sourceId: newConnection.source,
				targetId: newConnection.target,
				sourcePort: newConnection.sourceHandle,
				targetPort: newConnection.targetHandle,
			});
		},
		[
			isConnectionChanged,
			workflowId,
			updateConnection,
			pushSnapshot,
			getNodes,
			getEdges,
		],
	);

	const onEdgesDelete = useCallback(
		(deletedEdges: Edge[]) => {
			pushSnapshot(captureSnapshot(getNodes(), getEdges()));
			for (const edge of deletedEdges) {
				deleteConnection({ id: edge.id, workflowId });
			}
		},
		[deleteConnection, workflowId, pushSnapshot, getNodes, getEdges],
	);

	const onNodesDelete = useCallback(
		(deletedNodes: WorkflowCanvasNode[]) => {
			pushSnapshot(captureSnapshot(getNodes(), getEdges()));
			for (const canvasNode of deletedNodes) {
				deleteNode({ id: canvasNode.data.id, workflowId });
				const selectedNode = useWorkflowStore.getState().selectedNode;
				if (selectedNode?.id === canvasNode.id) {
					useWorkflowStore.getState().setSelectedNode(null);
				}
			}
		},
		[deleteNode, workflowId, pushSnapshot, getNodes, getEdges],
	);

	const debouncedUpdatePositions = useDebounce(
		updateNodesPositions,
		undefined,
		500,
	);

	const onNodeDragStart = useCallback(
		(_e: React.MouseEvent, _draggedNode: WorkflowCanvasNode) => {
			pushSnapshot(captureSnapshot(getNodes(), getEdges()));
		},
		[pushSnapshot, getNodes, getEdges],
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
				debouncedUpdatePositions({ workflowId, nodes: nodesToUpdate });
			}
		},
		[debouncedUpdatePositions, workflowId, setNodes, getNodes, queryClient],
	);

	if (nodesLoading || connectionsLoading) {
		return <Loader fullPage={false} />;
	}

	return (
		<FlowCanvas
			nodes={canvasNodes}
			edges={canvasEdges}
			onNodeClick={(_e, node) => handleNodeClick(node)}
			onNodeDragStart={onNodeDragStart}
			onNodesDelete={onNodesDelete}
			onNodeDragStop={onNodeDragStop}
			onEdgesDelete={onEdgesDelete}
			onConnect={onConnect}
			onReconnect={onReconnect}
		>
			<WorkflowControls />
		</FlowCanvas>
	);
};

const WorkflowCanvasLayout = () => {
	return (
		<div style={{ width: "100%", height: "100%" }}>
			<LayoutProvider
				initialDirection="RIGHT"
				initialAutoLayout={false}
				initialNodeDimensions={{ width: 100, height: 76 }}
			>
				<TestWebhook />
				<WorkflowCanvas />
			</LayoutProvider>
		</div>
	);
};

export default WorkflowCanvasLayout;
