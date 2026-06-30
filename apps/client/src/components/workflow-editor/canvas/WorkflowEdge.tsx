import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
	useEdges,
	useNodes,
	type XYPosition,
} from "@xyflow/react";
import type { WorkflowNodeData } from "@/constants/nodes";

const LABEL_OFFSET = 0.2;

const BACKWARD_OFFSET = 40;
const BACKWARD_PADDING = 80;
const BACKWARD_RADIUS = 16;

function dist(a: XYPosition, b: XYPosition): number {
	return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function getBend(
	a: XYPosition,
	b: XYPosition,
	c: XYPosition,
	size: number,
): string {
	const bendSize = Math.min(dist(a, b) / 2, dist(b, c) / 2, size);
	const { x, y } = b;

	if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
		return `L${x} ${y}`;
	}

	if (a.y === y) {
		const xDir = a.x < c.x ? -1 : 1;
		const yDir = a.y < c.y ? 1 : -1;
		return `L ${x + bendSize * xDir},${y} Q ${x},${y} ${x},${y + bendSize * yDir}`;
	}

	const xDir = a.x < c.x ? 1 : -1;
	const yDir = a.y < c.y ? -1 : 1;
	return `L ${x},${y + bendSize * yDir} Q ${x},${y} ${x + bendSize * xDir},${y}`;
}

function getBackwardPath(
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number,
): { path: string; labelX: number; labelY: number } {
	const routeY = Math.max(sourceY, targetY) + BACKWARD_PADDING;

	const points = [
		{ x: sourceX, y: sourceY },
		{ x: sourceX + BACKWARD_OFFSET, y: sourceY },
		{ x: sourceX + BACKWARD_OFFSET, y: routeY },
		{ x: targetX - BACKWARD_OFFSET, y: routeY },
		{ x: targetX - BACKWARD_OFFSET, y: targetY },
		{ x: targetX, y: targetY },
	] as const;

	const [first, second, third, fourth, fifth, sixth] = points;

	let path = `M ${first.x} ${first.y}`;
	path += ` ${getBend(first, second, third, BACKWARD_RADIUS)}`;
	path += ` ${getBend(second, third, fourth, BACKWARD_RADIUS)}`;
	path += ` ${getBend(third, fourth, fifth, BACKWARD_RADIUS)}`;
	path += ` ${getBend(fourth, fifth, sixth, BACKWARD_RADIUS)}`;
	path += ` L ${sixth.x} ${sixth.y}`;

	return {
		path,
		labelX: (second.x + fifth.x) / 2,
		labelY: routeY,
	};
}

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

	const isBackward = targetX < sourceX;

	let edgePath: string;
	let labelX: number;
	let labelY: number;

	if (isBackward) {
		const result = getBackwardPath(sourceX, sourceY, targetX, targetY);
		edgePath = result.path;
		labelX = result.labelX;
		labelY = result.labelY;
	} else {
		[edgePath, labelX, labelY] = getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition,
		});
	}

	const pointX = isBackward
		? labelX
		: sourceX + (labelX - sourceX) * LABEL_OFFSET;
	const pointY = isBackward
		? labelY - 12
		: sourceY + (labelY - sourceY) * LABEL_OFFSET;

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
