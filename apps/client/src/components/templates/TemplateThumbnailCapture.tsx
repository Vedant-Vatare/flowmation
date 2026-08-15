import type { TemplateData } from "@nodebase/shared";
import {
	Background,
	BackgroundVariant,
	MarkerType,
	ReactFlow,
	useNodesInitialized,
	useReactFlow,
	type EdgeTypes,
	type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
	memo,
	useEffect,
	useMemo,
	useRef,
	type CSSProperties,
	type RefObject,
} from "react";
import { WorkflowEdge } from "@/components/workflow-editor/canvas/WorkflowEdge";
import { WorkflowNode } from "@/components/workflow-editor/canvas/WorkflowNodes";
import {
	captureFlowDataUrl,
	fitNodesViewport,
	toThumbnailCanvasEdges,
	toThumbnailCanvasNodes,
} from "@/utils/thumbnail";
import "./thumbnail-capture.css";

const nodeTypes: NodeTypes = {
	workflowNode: WorkflowNode,
};

const edgeTypes: EdgeTypes = {
	workflow: WorkflowEdge,
};

type CaptureControllerProps = {
	rootRef: RefObject<HTMLDivElement | null>;
	width: number;
	height: number;
	pixelRatio: number;
	onReady: (dataUrl: string) => void;
	onError?: (error: unknown) => void;
};

const CaptureController = memo(
	({
		rootRef,
		width,
		height,
		pixelRatio,
		onReady,
		onError,
	}: CaptureControllerProps) => {
		const { getNodes, setViewport } = useReactFlow();
		const nodesInitialized = useNodesInitialized();
		const hasCaptured = useRef(false);

		useEffect(() => {
			if (!nodesInitialized || hasCaptured.current) return;
			hasCaptured.current = true;

			const nodes = getNodes();
			if (nodes.length === 0) {
				onReady("");
				return;
			}

			setViewport(fitNodesViewport(nodes, width, height), { duration: 0 });

			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					const root = rootRef.current;
					if (!root) return;
					captureFlowDataUrl(root, { width, height, pixelRatio })
						.then(onReady)
						.catch((error) => onError?.(error));
				}),
			);
		}, [
			nodesInitialized,
			getNodes,
			setViewport,
			width,
			height,
			pixelRatio,
			onReady,
			onError,
			rootRef,
		]);

		return null;
	},
);

type TemplateThumbnailCaptureProps = {
	nodes: TemplateData["nodes"];
	connections: TemplateData["connections"];
	onReady: (dataUrl: string) => void;
	onError?: (error: unknown) => void;
	width?: number;
	height?: number;
	pixelRatio?: number;
};

export const TemplateThumbnailCapture = ({
	nodes,
	connections,
	onReady,
	onError,
	width = 1280,
	height = 720,
	pixelRatio = 2,
}: TemplateThumbnailCaptureProps) => {
	const rootRef = useRef<HTMLDivElement>(null);

	const canvasNodes = useMemo(() => toThumbnailCanvasNodes(nodes), [nodes]);
	const canvasEdges = useMemo(
		() => toThumbnailCanvasEdges(connections),
		[connections],
	);

	const hiddenStyles: CSSProperties = {
		position: "absolute",
		top: 0,
		left: -9999,
		width,
		height,
		pointerEvents: "none",
		zIndex: -1,
	};

	return (
		<div ref={rootRef} className="thumbnail-capture" style={hiddenStyles}>
			<ReactFlow
				nodes={canvasNodes}
				edges={canvasEdges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				proOptions={{ hideAttribution: true }}
				nodesDraggable={false}
				nodesConnectable={false}
				elementsSelectable={false}
				panOnDrag={false}
				zoomOnScroll={false}
				zoomOnPinch={false}
				zoomOnDoubleClick={false}
				defaultEdgeOptions={{
					markerEnd: { type: MarkerType.ArrowClosed },
					style: { strokeWidth: 2, stroke: "var(--muted-foreground)" },
				}}
			>
				<Background
					variant={BackgroundVariant.Dots}
					gap={24}
					size={1.25}
					color="#d4d4d8"
				/>
				<CaptureController
					rootRef={rootRef}
					width={width}
					height={height}
					pixelRatio={pixelRatio}
					onReady={onReady}
					onError={onError}
				/>
			</ReactFlow>
		</div>
	);
};
