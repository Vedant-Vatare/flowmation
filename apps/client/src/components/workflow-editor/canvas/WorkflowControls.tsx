import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import type { NodeIdsWithPosition } from "@nodebase/shared";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Maximize2, Minus, Play, Plus, Waypoints } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/ui/shine-border";
import { useTestWorkflowExecution } from "@/hooks/useWorkflow";
import { cn } from "@/lib/utils";
import {
	useUpdateNodesPositions,
	useWorkflowNodesQuery,
} from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import {
	useWorkflowExecutionStore,
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
	const { zoomIn, zoomOut, fitView, setViewport, getNodes } = useReactFlow();
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
		<ShineBorder
			className="rounded-lg"
			borderWidth={1.5}
			duration={3.5}
			color="hsl(var(--primary))"
			disabled={isSelectingTrigger}
		>
			<Button
				variant="secondary"
				size="sm"
				className="gap-2 rounded-[calc(0.5rem-1.5px)] border border-primary/20 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
				onClick={handleExecute}
				disabled={isPending}
				title="Run this workflow once to test it"
				type="button"
			>
				<Play className="size-3.5 text-primary" />
				Test Workflow
			</Button>
		</ShineBorder>
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
				<TestWorkflowButton />
				<LiveLogsButton />
			</div>
		</div>
	);
}
