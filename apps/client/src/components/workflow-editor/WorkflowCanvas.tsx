import {
	LayoutProvider,
	useLayoutContext,
} from "@jalez/react-flow-automated-layout";
import {
	addEdge,
	Background,
	type Connection,
	ConnectionMode,
	ControlButton,
	Controls,
	type Edge,
	MarkerType,
	MiniMap,
	type NodeTypes,
	type OnEdgesDelete,
	ReactFlow,
	reconnectEdge,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";

import { useCallback, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { MagicWandIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { NodeIdsWithPosition } from "@nodebase/shared";
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
import { useWorkflowStore } from "@/store/workflow/useWorkflowStore";
import {
	getNodeColorByTask,
	toCanvasEdges,
	toCanvasNodes,
} from "@/utils/nodes.utils";
import { resolveCollisions } from "@/utils/resolve-collisions";
import Loader from "../ui/Loader";
import { useSidebar } from "../ui/sidebar";
import { WorkflowNode } from "./WorkflowNodes";

const nodeTypes: NodeTypes = {
	workflowNode: WorkflowNode,
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

	const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowCanvasNode>(
		[],
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const setTabOpen = useWorkflowSidbarTabsStore.getState().setTabOpen;
	const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
	const setTriggerNodes = useWorkflowStore((s) => s.setTriggerNodes);
	const executionTriggerFocusRequestKey = useWorkflowStore(
		(s) => s.executionTriggerFocusRequestKey,
	);
	const { setOpen } = useSidebar();
	const { applyLayout } = useLayoutContext();
	const { fitView } = useReactFlow();

	useEffect(() => {
		if (!workflowNodes) return;
		setNodes(toCanvasNodes(workflowNodes));
	}, [workflowNodes, setNodes]);

	useEffect(() => {
		const triggers = nodes
			.filter((node) => node.data.type === "trigger")
			.map((node) => ({
				id: node.id,
				workflowId: node.data.workflowId,
				task: node.data.task,
				name: node.data.name,
			}));

		setTriggerNodes(triggers);
	}, [nodes, setTriggerNodes]);

	useEffect(() => {
		if (!executionTriggerFocusRequestKey) return;
		const triggerIds = nodes
			.filter((node) => node.data.type === "trigger")
			.map((node) => node.id);

		if (triggerIds.length === 0) return;

		fitView({
			nodes: triggerIds.map((id) => ({ id })),
			padding: 0.45,
			duration: 350,
			maxZoom: 1,
		});
	}, [executionTriggerFocusRequestKey, nodes, fitView]);

	useEffect(() => {
		if (!workflowConnections) return;
		setEdges(toCanvasEdges(workflowConnections));
	}, [workflowConnections, setEdges]);

	const handleNodeClick = (node: WorkflowCanvasNode) => {
		setOpen(true);
		setSelectedNode(node);
		setTabOpen("editor");
	};

	const onConnect = useCallback(
		(connection: Connection) => {
			if (!connection.sourceHandle || !connection.targetHandle) return null;
			setEdges((eds) => addEdge(connection, eds));
			createNewConnection({
				id: crypto.randomUUID(),
				workflowId: workflowId,
				sourceId: connection.source,
				targetId: connection.target,
				sourcePort: connection.sourceHandle,
				targetPort: connection.targetHandle,
			});
		},
		[setEdges, createNewConnection, workflowId],
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

	const onReconnect = useCallback(
		(oldEdge: Edge, newConnection: Connection) => {
			if (
				!isConnectionChanged(oldEdge, newConnection) ||
				!newConnection.sourceHandle ||
				!newConnection.targetHandle
			)
				return null;

			setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
			updateConnection({
				id: oldEdge.id,
				workflowId: workflowId,
				sourceId: newConnection.source,
				targetId: newConnection.target,
				sourcePort: newConnection.sourceHandle,
				targetPort: newConnection.targetHandle,
			});
		},
		[setEdges, isConnectionChanged, workflowId, updateConnection],
	);

	const onEdgesDelete: OnEdgesDelete<Edge> = useCallback(
		(deletedEdges) => {
			for (const edge of deletedEdges) {
				deleteConnection({ id: edge.id });
			}
		},
		[deleteConnection],
	);

	const onNodesDelete = useCallback(
		(deletedNodes: WorkflowCanvasNode[]) => {
			for (const canvasNode of deletedNodes) {
				deleteNode({ id: canvasNode.data.id, workflowId });
			}
		},
		[deleteNode, workflowId],
	);

	const saveNodePosition = useCallback(
		(canvasNode: WorkflowCanvasNode) => {
			updateNode({
				id: canvasNode.id,
				task: canvasNode.data.task,
				positionX: Math.round(canvasNode.position.x),
				positionY: Math.round(canvasNode.position.y),
			});
		},
		[updateNode],
	);

	const debouncedSaveNode = useDebounce(
		saveNodePosition,
		(node: WorkflowCanvasNode) => node.id,
	);

	const handleApplyLayout = useCallback(async () => {
		const formatedCanvas = await applyLayout();
		if (!formatedCanvas) return;

		const nodesWithPosition = formatedCanvas.nodes.reduce(
			(acc: NodeIdsWithPosition, curr) => {
				acc.push({
					id: curr.id,
					positionX: Math.round(curr.position.x),
					positionY: Math.round(curr.position.y),
				});
				return acc;
			},
			[],
		);
		const changedNodes = nodesWithPosition.filter((node) => {
			const n = nodes.find((n) => n.id === node.id);
			if (!n) return false;
			return (
				Math.round(n.position.x) !== node.positionX ||
				Math.round(n.position.y) !== node.positionY
			);
		});
		if (changedNodes.length === 0) return;
		updateNodesPositions(changedNodes);
	}, [applyLayout, updateNodesPositions, nodes]);

	if (nodesLoading || connectionsLoading) {
		return <Loader fullPage={false} />;
	}

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			nodeTypes={nodeTypes}
			fitView={true}
			fitViewOptions={{
				duration: 250,
				padding: 0.75,
				minZoom: 1,
				maxZoom: 1,
			}}
			maxZoom={1.25}
			minZoom={0.5}
			onNodesChange={onNodesChange}
			onNodeClick={(_e, node) => handleNodeClick(node)}
			onNodesDelete={onNodesDelete}
			onNodeDragStop={(_e, node) => {
				const resolvedPositions = resolveCollisions([...nodes], {
					maxIterations: 50,
					overlapThreshold: 0.5,
					margin: 20,
				});

				setNodes(resolvedPositions);

				const finalNode =
					resolvedPositions.find((n) => n.id === node.id) || node;
				debouncedSaveNode(finalNode);

				const changedNodes = resolvedPositions
					.filter((n) => {
						const original = nodes.find((on) => on.id === n.id);
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
					updateNodesPositions(changedNodes);
				}
			}}
			onEdgesChange={onEdgesChange}
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
					bottom: "3rem",
					right: "0.5rem",
				}}
				maskColor="hsl(var(--background) / 0.6)"
				nodeColor={(n) => getNodeColorByTask((n.data as WorkflowNodeData).task)}
			/>
			<Controls
				position="bottom-left"
				showInteractive={false}
				style={{
					display: "flex",
					flexDirection: "row",
					bottom: "3rem",
					scale: "1.1",
				}}
			>
				<ControlButton onClick={handleApplyLayout} title="Auto-layout nodes">
					<HugeiconsIcon icon={MagicWandIcon} size={14} />
				</ControlButton>
			</Controls>
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
				initialNodeDimensions={{ width: 128, height: 112 }}
			>
				<WorkflowCanvas />
			</LayoutProvider>
		</div>
	);
};

export default WorkflowCanvasLayout;
