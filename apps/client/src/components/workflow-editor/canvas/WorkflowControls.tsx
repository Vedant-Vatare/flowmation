import { Redo03Icon, Undo03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import type { NodeIdsWithPosition, WorkflowConnection } from "@nodebase/shared";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Maximize2, Minus, Play, Plus, Waypoints } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	addWorkflowNodeApi,
	addWorkflowNodeConnApi,
	deleteWorkflowConnApi,
	deleteWorkflowNodeApi,
	getWorkflowConnections,
	getWorkflowNodes,
	updateNodesPositionApi,
} from "@/apis/userWorkflow";
import { Button } from "@/components/ui/button";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useDebounce } from "@/hooks/debounce";
import { readCachedSnapshot } from "@/hooks/useCanvasHistoryRecorder";
import { useTestWorkflowExecution } from "@/hooks/useWorkflow";
import { cn } from "@/lib/utils";
import {
	useUpdateNodesPositions,
	useWorkflowNodesQuery,
	workflowNodesOptions,
} from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import {
	type CanvasSnapshot,
	useCanvasHistoryStore,
} from "@/store/workflow/useCanvasHistoryStore";
import {
	usePublishStatusStore,
	useWorkflowExecutionStore,
	useWorkflowStore,
	useWorkflowTriggerStore,
} from "@/store/workflow/useWorkflowStore";

const MIN_ZOOM = 50;
const MAX_ZOOM = 150;

function ControlButton({
	children,
	onClick,
	title,
	disabled,
	className,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	title?: string;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<button
			type="button"
			className={cn(
				"wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer transition-[background,color] duration-150 ease-out outline-none disabled:pointer-events-none disabled:opacity-40",
				className,
			)}
			onClick={onClick}
			title={title}
			disabled={disabled}
		>
			{children}
		</button>
	);
}

const ZoomControls = () => {
	const { workflowId } = Route.useParams();
	const { zoomIn, zoomOut, fitView, setViewport, getNodes } =
		useReactFlow<WorkflowCanvasNode>();
	const viewport = useViewport();
	const { mutate: updateNodesPositions } = useUpdateNodesPositions();
	const { applyLayout } = useLayoutContext();
	const [zoom, setZoom] = useState(100);
	const [zoomInput, setZoomInput] = useState("100");
	const [isEditing, setIsEditing] = useState(false);
	const zoomRef = useRef(100);
	const inputRef = useRef<HTMLInputElement>(null);

	const viewportRef = useRef(viewport);
	useEffect(() => {
		viewportRef.current = viewport;
	}, [viewport]);

	const applyZoom = useCallback(
		(zoomLevel: number) => {
			const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel));
			const { x = 0, y = 0 } = viewportRef.current;
			setViewport({ x, y, zoom: clamped / 100 }, { duration: 0 });
			setZoom(clamped);
			setZoomInput(clamped.toString());
			zoomRef.current = clamped;
		},
		[setViewport],
	);

	const commitZoomInput = useCallback(() => {
		const value = parseInt(zoomInput, 10);
		if (Number.isNaN(value) || zoomInput === "") {
			setZoomInput(zoomRef.current.toString());
		} else {
			applyZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value)));
		}
		setIsEditing(false);
	}, [zoomInput, applyZoom]);

	const handleZoomInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") return commitZoomInput();
			if (e.key === "Escape") {
				setZoomInput(zoomRef.current.toString());
				return setIsEditing(false);
			}
			const step = e.key === "ArrowUp" ? 10 : e.key === "ArrowDown" ? -10 : 0;
			if (step) {
				e.preventDefault();
				const next = Math.min(
					MAX_ZOOM,
					Math.max(
						MIN_ZOOM,
						(parseInt(zoomInput, 10) || zoomRef.current) + step,
					),
				);
				setZoomInput(next.toString());
				applyZoom(next);
			}
		},
		[zoomInput, applyZoom, commitZoomInput],
	);

	const handleApplyLayout = useCallback(async () => {
		const nodesBefore = getNodes().reduce<
			Record<string, { x: number; y: number }>
		>((acc, n) => {
			acc[n.id] = {
				x: Math.round(n.position.x),
				y: Math.round(n.position.y),
			};
			return acc;
		}, {});

		const formatted = await applyLayout();
		if (!formatted) return;

		const changed = formatted.nodes.reduce<NodeIdsWithPosition>((acc, curr) => {
			const before = nodesBefore[curr.id];
			const nx = Math.round(curr.position.x);
			const ny = Math.round(curr.position.y);
			if (!before || before.x !== nx || before.y !== ny)
				acc.push({ id: curr.id, positionX: nx, positionY: ny });
			return acc;
		}, []);

		if (changed.length > 0)
			updateNodesPositions({ workflowId, nodes: changed });
	}, [applyLayout, getNodes, workflowId, updateNodesPositions]);

	useEffect(() => {
		const current = Math.round((viewport.zoom || 1) * 100);
		if (current === zoomRef.current) return;
		setZoom(current);
		if (!isEditing) {
			setZoomInput(current.toString());
			zoomRef.current = current;
		}
	}, [viewport, isEditing]);

	return (
		<div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-sidebar-accent px-1.5 py-1">
			<ControlButton onClick={() => zoomOut()} title="Zoom out">
				<Minus size={16} strokeWidth={2} />
			</ControlButton>

			{isEditing ? (
				<input
					ref={inputRef}
					type="text"
					inputMode="numeric"
					value={zoomInput}
					onChange={(e) => {
						if (/^\d*$/.test(e.target.value)) setZoomInput(e.target.value);
					}}
					onBlur={commitZoomInput}
					onKeyDown={handleZoomInputKeyDown}
					className="w-11.25 rounded border border-border bg-background px-1 py-0.5 text-center text-[0.8125rem] font-medium text-foreground"
				/>
			) : (
				<button
					type="button"
					className="wf-control-btn min-w-10 cursor-pointer rounded px-1 text-[0.8125rem] font-medium text-foreground"
					onClick={() => {
						setIsEditing(true);
						setTimeout(() => inputRef.current?.focus(), 0);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setIsEditing(true);
							setTimeout(() => inputRef.current?.focus(), 0);
						}
					}}
					title="Click to edit zoom level"
				>
					{zoom}
				</button>
			)}

			<ControlButton onClick={() => zoomIn()} title="Zoom in">
				<Plus size={16} strokeWidth={2} />
			</ControlButton>

			<div className="mx-0.5 h-4 w-px bg-border" />

			<ControlButton
				onClick={() => fitView({ duration: 250, padding: 0.2 })}
				title="Zoom to fit all nodes"
			>
				<Maximize2 size={15} strokeWidth={1.75} />
			</ControlButton>

			<ControlButton
				onClick={handleApplyLayout}
				title="Arrange nodes automatically"
			>
				<Waypoints size={15} strokeWidth={1.75} />
			</ControlButton>
		</div>
	);
};

async function saveCanvasHistory(
	workflowId: string,
	before: CanvasSnapshot,
	after: CanvasSnapshot,
) {
	const previousNodes = new Map(before.nodes.map((node) => [node.id, node]));
	const nextNodes = new Map(after.nodes.map((node) => [node.id, node]));
	const previousEdges = new Map(before.edges.map((edge) => [edge.id, edge]));
	const nextEdges = new Map(after.edges.map((edge) => [edge.id, edge]));

	for (const edge of before.edges) {
		if (
			nextNodes.has(edge.source) &&
			nextNodes.has(edge.target) &&
			JSON.stringify(edge) !== JSON.stringify(nextEdges.get(edge.id))
		)
			await deleteWorkflowConnApi({ id: edge.id, workflowId });
	}
	for (const node of before.nodes) {
		if (!nextNodes.has(node.id))
			await deleteWorkflowNodeApi(node.id, workflowId);
	}
	for (const node of after.nodes) {
		if (!previousNodes.has(node.id)) await addWorkflowNodeApi(node);
	}
	for (const edge of after.edges) {
		if (JSON.stringify(edge) !== JSON.stringify(previousEdges.get(edge.id))) {
			await addWorkflowNodeConnApi({
				id: edge.id,
				workflowId,
				sourceId: edge.source,
				targetId: edge.target,
				sourcePort: edge.sourceHandle,
				targetPort: edge.targetHandle,
			});
		}
	}
	const moved = after.nodes
		.filter((node) => {
			const previous = previousNodes.get(node.id);
			return (
				previous &&
				(previous.positionX !== node.positionX ||
					previous.positionY !== node.positionY)
			);
		})
		.map(({ id, positionX, positionY }) => ({ id, positionX, positionY }));
	if (moved.length) await updateNodesPositionApi({ workflowId, nodes: moved });
}

const UndoRedoControls = () => {
	const { workflowId } = Route.useParams();
	const queryClient = useQueryClient();
	const saving = useIsMutating() > 0;
	const restoring = useCanvasHistoryStore(
		(s) => s.restoringWorkflowId !== null,
	);
	const checkingHistory = useCanvasHistoryStore((s) => s.historyCheckPending);
	const [queuedDirection, setQueuedDirection] = useState<
		"undo" | "redo" | null
	>(null);
	const canUndo = useCanvasHistoryStore((s) => s.undoStack.length > 0);
	const canRedo = useCanvasHistoryStore((s) => s.redoStack.length > 0);

	const pending = useRef<{
		workflowId: string;
		before: CanvasSnapshot;
		after: CanvasSnapshot;
	} | null>(null);
	const save = useDebounce(
		async (
			id: string,
			before: CanvasSnapshot,
			after: CanvasSnapshot,
			appliedHistory: CanvasSnapshot[],
		) => {
			pending.current = null;
			const history = useCanvasHistoryStore.getState();
			const nodesKey = workflowNodesOptions(id).queryKey;
			const edgesKey = ["workflow-connections", { workflowId: id }];
			try {
				await saveCanvasHistory(id, before, after);
				const connections =
					queryClient.getQueryData<WorkflowConnection[]>(edgesKey);
				if (
					connections &&
					useCanvasHistoryStore.getState().undoStack === appliedHistory
				)
					usePublishStatusStore
						.getState()
						.checkForStatusChanges(after.nodes, connections);
			} catch {
				toast.error("Could not save the history change");
				if (useCanvasHistoryStore.getState().undoStack === appliedHistory)
					history.clear();
				await Promise.allSettled([
					getWorkflowNodes(id).then((nodes) =>
						queryClient.setQueryData(nodesKey, nodes),
					),
					getWorkflowConnections(id).then((edges) =>
						queryClient.setQueryData(edgesKey, edges),
					),
				]);
			} finally {
				history.setRestoringWorkflowId(null);
			}
		},
		undefined,
		750,
	);

	const restore = useCallback(
		(direction: "undo" | "redo") => {
			const history = useCanvasHistoryStore.getState();
			const queued =
				pending.current?.workflowId === workflowId ? pending.current : null;
			if (
				(!queued &&
					(history.restoringWorkflowId || history.historyCheckPending)) ||
				queryClient.isMutating()
			) {
				setQueuedDirection(direction);
				return;
			}
			const current =
				queued?.after ?? readCachedSnapshot(queryClient, workflowId);
			if (!current) return;
			const snapshot = history[direction](current);
			if (!snapshot) return;

			history.setRestoringWorkflowId(workflowId);
			const currentById = new Map(current.nodes.map((node) => [node.id, node]));
			const next = {
				edges: snapshot.edges,
				nodes: snapshot.nodes.map((node) => ({
					...(currentById.get(node.id) ?? node),
					positionX: node.positionX,
					positionY: node.positionY,
				})),
			};
			queryClient.setQueryData(
				workflowNodesOptions(workflowId).queryKey,
				next.nodes,
			);
			queryClient.setQueryData(
				["workflow-connections", { workflowId }],
				next.edges.map((edge) => ({
					id: edge.id,
					workflowId,
					sourceId: edge.source,
					targetId: edge.target,
					sourcePort: edge.sourceHandle,
					targetPort: edge.targetHandle,
				})),
			);
			const selection = useWorkflowStore.getState();
			if (!next.nodes.some((node) => node.id === selection.selectedNodeId))
				selection.setSelectedNodeId(null);

			const before = queued?.before ?? current;
			pending.current = { workflowId, before, after: next };
			save(
				workflowId,
				before,
				next,
				useCanvasHistoryStore.getState().undoStack,
			);
		},
		[queryClient, save, workflowId],
	);

	useEffect(() => {
		if (!queuedDirection || saving || restoring || checkingHistory) return;
		setQueuedDirection(null);
		restore(queuedDirection);
	}, [queuedDirection, saving, restoring, checkingHistory, restore]);

	const handleUndo = useCallback(() => void restore("undo"), [restore]);
	const handleRedo = useCallback(() => void restore("redo"), [restore]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLElement &&
				e.target.closest(
					"input, textarea, select, [contenteditable]:not([contenteditable=false])",
				)
			)
				return;
			const mod = e.metaKey || e.ctrlKey;
			if (!mod) return;

			if (e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				handleUndo();
			} else if (e.key === "z" && e.shiftKey) {
				e.preventDefault();
				handleRedo();
			} else if (e.key === "y" && mod) {
				e.preventDefault();
				handleRedo();
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleUndo, handleRedo]);

	return (
		<div className="flex h-9 items-center gap-1 rounded-lg border border-border bg-sidebar-accent px-1.5 py-1">
			<ControlButton
				onClick={handleUndo}
				disabled={!canUndo || saving || restoring || checkingHistory}
				title="Undo (Ctrl+Z)"
			>
				<HugeiconsIcon icon={Undo03Icon} size={16} strokeWidth={1.75} />
			</ControlButton>
			<ControlButton
				onClick={handleRedo}
				disabled={!canRedo || saving || restoring || checkingHistory}
				title="Redo (Ctrl+Y)"
			>
				<HugeiconsIcon icon={Redo03Icon} size={16} strokeWidth={1.75} />
			</ControlButton>
		</div>
	);
};

const TestWorkflowButton = () => {
	const { workflowId } = Route.useParams();
	const { data: workflowNodes } = useWorkflowNodesQuery(workflowId);
	const { executeTriggerNode, isPending } = useTestWorkflowExecution();
	const isSelectingTrigger = useWorkflowTriggerStore(
		(s) => s.isSelectingTrigger,
	);
	const setIsSelectingTrigger = useWorkflowTriggerStore(
		(s) => s.setIsSelectingTrigger,
	);
	const requestTriggerFocus = useWorkflowTriggerStore(
		(s) => s.requestTriggerFocus,
	);
	const clearExecutionUpdates = useWorkflowExecutionStore(
		(s) => s.clearExecutionUpdates,
	);

	const handleExecute = () => {
		const triggerNodes =
			workflowNodes?.filter((n) => n.type === "trigger") ?? [];
		clearExecutionUpdates();

		if (triggerNodes.length === 0) {
			toast.info("Add a trigger node to test this workflow.");
			return;
		}

		if (triggerNodes.length === 1) {
			const trigger = triggerNodes[0];
			if (!trigger) return;
			executeTriggerNode(trigger);
			setIsSelectingTrigger(false);
			return;
		}

		setIsSelectingTrigger(!isSelectingTrigger);
		requestTriggerFocus();
	};

	return (
		<Button
			variant="outline"
			size="sm"
			className="gap-2 border-border bg-card text-card-foreground shadow-none hover:bg-muted hover:text-foreground dark:bg-card dark:hover:bg-muted"
			aria-pressed={isSelectingTrigger}
			onClick={handleExecute}
			disabled={isPending}
			title="Run this workflow once to test it"
			type="button"
		>
			<Play className="size-3.5 text-primary" />
			{isPending ? "Running…" : "Test workflow"}
		</Button>
	);
};

const LiveLogsButton = () => {
	const showLiveExecutionPanel = useWorkflowExecutionStore(
		(s) => s.showLiveExecutionPanel,
	);
	const setLiveExecutionPanel = useWorkflowExecutionStore(
		(s) => s.setLiveExecutionPanel,
	);
	const hasUpdates = useWorkflowExecutionStore(
		(s) => Object.keys(s.nodeExecutionUpdates).length > 0,
	);
	if (showLiveExecutionPanel || !hasUpdates) return null;
	return (
		<AnimatePresence>
			<motion.div
				initial={{ y: 50, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 50, opacity: 0 }}
				transition={{ type: "spring", stiffness: 300, damping: 25 }}
			>
				<Button
					variant="secondary"
					size="sm"
					className="gap-2 rounded-[calc(0.5rem-1.5px)] border border-primary/20 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
					title="open live execution panel"
					onClick={() => setLiveExecutionPanel(true)}
				>
					Show Logs
				</Button>
			</motion.div>
		</AnimatePresence>
	);
};

export function WorkflowControls() {
	return (
		<div className="absolute bottom-7 left-1/2 z-5 -translate-x-1/2">
			<div className="flex items-center gap-3">
				<ZoomControls />
				<UndoRedoControls />
				<TestWorkflowButton />
				<LiveLogsButton />
			</div>
		</div>
	);
}
