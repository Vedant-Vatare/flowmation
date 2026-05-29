import { LayoutProvider } from "@jalez/react-flow-automated-layout";
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
	useNodes,
	useReactFlow,
} from "@xyflow/react";

import { useCallback, useEffect } from "react";
import "@xyflow/react/dist/style.css";

import Loader from "@/components/ui/Loader";
import type { WorkflowCanvasNode, WorkflowNodeData } from "@/constants/nodes";
import { useDebounce } from "@/hooks/debounce";
import {
	useAddWorkflowConn,
	useDeleteWorkflowConn,
	useDeleteWorkflowNode,
	useUpdateNodesPositions,
	useUpdateWorkflowConn,
	useUpdateWorkflowNode,
	useWorkflowConnectionsQuery,
	useWorkflowNodesQuery,
} from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import { useWorkflowSidbarTabsStore } from "@/store/workflow/useWorkflowEditor";
import {
	useWorkflowStore,
	useWorkflowTriggerStore,
} from "@/store/workflow/useWorkflowStore";
import {
	getNodeColorByTask,
	toCanvasEdges,
	toCanvasNodes,
} from "@/utils/nodes/nodes.utils";
import { resolveCollisions } from "@/utils/resolve-collisions";
import { TestWebhook } from "../TestWebhook";
import { WorkflowControls } from "./WorkflowControls";
import { WorkflowEdge } from "./WorkflowEdge";
import { WorkflowNode } from "./WorkflowNodes";

const nodeTypes: NodeTypes = {
	workflowNode: WorkflowNode,
};

const edgeTypes: EdgeTypes = {
	workflow: WorkflowEdge,
};

const WorkflowCanvas = () => {
	const { workflowId } = Route.useParams();
	const { data: workflowNodes, isLoading: nodesLoading } =
		useWorkflowNodesQuery(workflowId);
	const { data: workflowConnections, isLoading: connectionsLoading } =
		useWorkflowConnectionsQuery(workflowId);
	const { mutate: updateNode } = useUpdateWorkflowNode();
	const { mutate: deleteNode } = useDeleteWorkflowNode();
	const { mutate: createNewConnection } = useAddWorkflowConn();
	const { mutate: updateConnection } = useUpdateWorkflowConn();
	const { mutate: deleteConnection } = useDeleteWorkflowConn();
	const { mutate: updateNodesPositions } = useUpdateNodesPositions();

	const { fitView, getNodes, setNodes, setEdges } =
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

	const saveNodePosition = useCallback(
		(canvasNode: WorkflowCanvasNode) => {
			updateNode({
				workflowId,
				node: {
					id: canvasNode.id,
					task: canvasNode.data.task,
					positionX: Math.round(canvasNode.position.x),
					positionY: Math.round(canvasNode.position.y),
				},
			});
		},
		[updateNode, workflowId],
	);

	const debouncedSaveNode = useDebounce(
		saveNodePosition,
		(node: WorkflowCanvasNode) => node.id,
	);

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

	const onEdgesDelete: OnEdgesDelete<Edge> = useCallback(
		(deletedEdges) => {
			for (const edge of deletedEdges) {
				deleteConnection({ id: edge.id, workflowId });
			}
		},
		[deleteConnection, workflowId],
	);

	const onNodesDelete = useCallback(
		(deletedNodes: WorkflowCanvasNode[]) => {
			for (const canvasNode of deletedNodes) {
				deleteNode({ id: canvasNode.data.id, workflowId });
				const selectedNode = useWorkflowStore.getState().selectedNode;
				if (selectedNode?.id === canvasNode.id) {
					useWorkflowStore.getState().setSelectedNode(null);
				}
			}
		},
		[deleteNode, workflowId],
	);

	const onNodeDragStop = useCallback(
		(_e: React.MouseEvent<Element, MouseEvent>, node: WorkflowCanvasNode) => {
			const currentNodes = getNodes();
			const resolvedPositions = resolveCollisions([...currentNodes], {
				maxIterations: 50,
				overlapThreshold: 0.5,
				margin: 20,
			});

			setNodes(resolvedPositions);

			const finalNode = resolvedPositions.find((n) => n.id === node.id) ?? node;
			debouncedSaveNode(finalNode as WorkflowCanvasNode);

			const changedNodes = resolvedPositions
				.filter((n) => {
					const original = currentNodes.find((on) => on.id === n.id);
					return (
						original &&
						(Math.round(original.position.x) !== Math.round(n.position.x) ||
							Math.round(original.position.y) !== Math.round(n.position.y))
					);
				})
				.filter((n) => n.id !== node.id)
				.map((n) => ({
					id: n.id,
					positionX: Math.round(n.position.x),
					positionY: Math.round(n.position.y),
				}));

			if (changedNodes.length > 0) {
				updateNodesPositions({ workflowId, nodes: changedNodes });
			}
		},
		[updateNodesPositions, workflowId, debouncedSaveNode, setNodes, getNodes],
	);

	if (nodesLoading || connectionsLoading) {
		return <Loader fullPage={false} />;
	}

	return (
		<ReactFlow
			defaultNodes={canvasNodes}
			defaultEdges={canvasEdges}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			proOptions={{ hideAttribution: true }}
			fitView={false}
			fitViewOptions={{
				duration: 250,
				padding: 0.75,
				minZoom: 1,
				maxZoom: 1,
			}}
			maxZoom={2}
			minZoom={0.5}
			onNodeClick={(_e, node) => handleNodeClick(node)}
			onNodesDelete={onNodesDelete}
			onNodeDragStop={onNodeDragStop}
			onEdgesDelete={onEdgesDelete}
			onConnect={onConnect}
			onReconnect={onReconnect}
			connectionRadius={20}
			connectionMode={ConnectionMode.Strict}
			deleteKeyCode="Delete"
			panOnDrag={[1]}
			selectionOnDrag={true}
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
					bottom: "1rem",
					right: "0.75rem",
				}}
				maskColor="hsl(var(--background) / 0.6)"
				nodeColor={(n) => getNodeColorByTask((n.data as WorkflowNodeData).task)}
			/>
			<WorkflowControls />
			<Background />
		</ReactFlow>
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
