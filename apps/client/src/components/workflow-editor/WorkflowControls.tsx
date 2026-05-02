import {
	Fullscreen,
	MagicWandIcon,
	Minus,
	Plus,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import type { NodeIdsWithPosition } from "@nodebase/shared";
import {
	ControlButton,
	Controls,
	useNodesState,
	useReactFlow,
	useViewport,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useUpdateNodesPositions } from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";

export function WorkflowControls() {
	const MAX_ZOOM = 150;
	const MIN_ZOOM = 50;
	const { workflowId } = Route.useParams();
	const [nodes] = useNodesState<WorkflowCanvasNode>([]);
	const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
	const viewport = useViewport();
	const { mutate: updateNodesPositions } = useUpdateNodesPositions();
	const [zoom, setZoom] = useState(100);
	const [zoomInput, setZoomInput] = useState("100");
	const [isEditing, setIsEditing] = useState(false);
	const { applyLayout } = useLayoutContext();
	const zoomRef = useRef(100);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFitView = useCallback(() => {
		fitView({ duration: 250, padding: 0.2 });
	}, [fitView]);

	const applyZoom = useCallback(
		(zoomLevel: number) => {
			const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel));
			const zoomValue = clampedZoom / 100;

			// Get current viewport center
			const x = viewport.x || 0;
			const y = viewport.y || 0;

			setViewport({ x, y, zoom: zoomValue }, { duration: 0 });
			setZoom(clampedZoom);
			setZoomInput(clampedZoom.toString());
			zoomRef.current = clampedZoom;
		},
		[viewport, setViewport],
	);

	const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		// Only allow numbers
		if (/^\d*$/.test(value) && value !== "") {
			const numValue = parseInt(value, 10);
			setZoomInput(value);
			// Apply zoom in real-time as user types
			applyZoom(numValue);
		}
	};

	const handleZoomInputBlur = () => {
		const value = parseInt(zoomInput, 10);

		if (Number.isNaN(value) || value === 0) {
			setZoomInput(zoomRef.current.toString());
			setIsEditing(false);
			return;
		}

		const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
		applyZoom(clampedZoom);
		setIsEditing(false);
	};

	const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleZoomInputBlur();
		} else if (e.key === "Escape") {
			setZoomInput(zoomRef.current.toString());
			setIsEditing(false);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			const newValue = Math.min(MAX_ZOOM, parseInt(zoomInput, 10) + 10 || 100);
			setZoomInput(newValue.toString());
			applyZoom(newValue);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			const newValue = Math.max(MIN_ZOOM, parseInt(zoomInput, 10) - 10 || 100);
			setZoomInput(newValue.toString());
			applyZoom(newValue);
		}
	};

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
		updateNodesPositions({ workflowId, nodes: changedNodes });
	}, [applyLayout, nodes, workflowId, updateNodesPositions]);

	// Update zoom display when viewport changes (external zoom)
	useEffect(() => {
		const currentZoom = Math.round((viewport.zoom || 1) * 100);
		setZoom(currentZoom);
		if (!isEditing) {
			setZoomInput(currentZoom.toString());
			zoomRef.current = currentZoom;
		}
	}, [viewport, isEditing]);

	return (
		<Controls
			position="bottom-left"
			showInteractive={false}
			showZoom={false}
			showFitView={false}
			className="bg-sidebar-accent"
			style={{
				display: "flex",
				gap: "0.5rem",
				alignItems: "center",
				flexDirection: "row",
				bottom: "4rem",
				left: "1.5rem",
				height: "2rem",
			}}
		>
			<ControlButton onClick={() => zoomOut()} title="Zoom out">
				<HugeiconsIcon icon={Minus} size={18} strokeWidth={4} />
			</ControlButton>

			{isEditing ? (
				<input
					ref={inputRef}
					type="text"
					inputMode="numeric"
					value={zoomInput}
					onChange={handleZoomInputChange}
					onBlur={handleZoomInputBlur}
					onKeyDown={handleZoomInputKeyDown}
					style={{
						width: "45px",
						textAlign: "center",
						fontSize: "0.875rem",
						fontWeight: 500,
						border: "1px solid hsl(var(--border))",
						borderRadius: "4px",
						padding: "2px 4px",
						background: "hsl(var(--background))",
						color: "var(--text-primary)",
						fontFamily: "inherit",
					}}
				/>
			) : (
				<button
					type="button"
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
					style={{
						minWidth: "45px",
						textAlign: "center",
						fontSize: "0.875rem",
						fontWeight: 500,
						color: "var(--text-primary)",
						cursor: "pointer",
						padding: "2px 4px",
						borderRadius: "4px",
						transition: "background 0.2s",
						userSelect: "none",
						border: "none",
						background: "transparent",
						fontFamily: "inherit",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = "hsl(var(--accent) / 0.1)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = "transparent";
					}}
					title="Click to edit zoom level"
				>
					{zoom}
				</button>
			)}

			<ControlButton onClick={() => zoomIn()} title="Zoom in">
				<HugeiconsIcon icon={Plus} size={18} strokeWidth={4} />
			</ControlButton>

			<ControlButton onClick={handleFitView} title="Fit to view">
				<HugeiconsIcon icon={Fullscreen} size={18} strokeWidth={4} />
			</ControlButton>

			<ControlButton onClick={handleApplyLayout} title="Auto-layout nodes">
				<HugeiconsIcon icon={MagicWandIcon} size={18} strokeWidth={2} />
			</ControlButton>

			<style>{`
				input[type="text"]::-webkit-outer-spin-button,
				input[type="text"]::-webkit-inner-spin-button {
					-webkit-appearance: none;
					margin: 0;
				}
				input[type="text"][inputmode="numeric"] {
					-moz-appearance: textfield;
				}
			`}</style>
		</Controls>
	);
}
