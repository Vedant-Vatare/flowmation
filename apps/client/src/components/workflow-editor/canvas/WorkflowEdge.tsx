import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
	useEdges,
	useNodes,
} from "@xyflow/react";
import type { WorkflowNodeData } from "@/constants/nodes";

const LABEL_OFFSET = 0.2;

export function WorkflowEdge({
	id,
	source,
	sourceHandleId,
	sourceX,
	sourceY,
	sourcePosition,
	targetX,
	targetY,
	targetPosition,
	markerEnd,
}: EdgeProps) {
	const nodes = useNodes();
	const edges = useEdges();
	const sourceNode = nodes.find((n) => n.id === source);
	const nodeData = sourceNode?.data as WorkflowNodeData | undefined;

	const hasMultipleOutputs = (nodeData?.outputPorts?.length ?? 0) > 1;
	const sourcePort = nodeData?.outputPorts?.find(
		(p) => p.name === sourceHandleId,
	);

	const isPortConnected = edges.some(
		(e) =>
			e.source === source && e.sourceHandle === sourceHandleId && e.id !== id,
	);

	const label =
		hasMultipleOutputs && sourcePort?.label && !isPortConnected
			? sourcePort.label
			: null;

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const pointX = sourceX + (labelX - sourceX) * LABEL_OFFSET;
	const pointY = sourceY + (labelY - sourceY) * LABEL_OFFSET;

	return (
		<>
			<BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
			{label && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: "absolute",
							transform: `translate(0, -50%) translate(${pointX}px, ${pointY}px)`,
							pointerEvents: "all",
						}}
						className="nodrag nopan edge-label"
					>
						{label}
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
