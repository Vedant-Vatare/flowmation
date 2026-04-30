import type { WorkflowCanvasNode } from "@/constants/nodes";

export type CollisionAlgorithmOptions = {
	maxIterations: number;
	overlapThreshold: number;
	margin: number;
};

export type CollisionAlgorithm = (
	nodes: WorkflowCanvasNode[],
	options: CollisionAlgorithmOptions,
) => WorkflowCanvasNode[];

type Box = {
	x: number;
	y: number;
	width: number;
	height: number;
	moved: boolean;
	node: WorkflowCanvasNode;
};

function getBoxesFromNodes(nodes: WorkflowCanvasNode[], margin = 0): Box[] {
	const boxes: Box[] = new Array(nodes.length);

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (!node) break;

		boxes[i] = {
			x: node.position.x - margin,
			y: node.position.y - margin,
			width: (node.width ?? node.measured?.width ?? 220) + margin * 2,
			height: (node.height ?? node.measured?.height ?? 80) + margin * 2,
			node,
			moved: false,
		};
	}

	return boxes;
}

export const hasCollisions = (
	nodes: WorkflowCanvasNode[],
	margin = 0,
): boolean => {
	const boxes = getBoxesFromNodes(nodes, margin);

	for (let i = 0; i < boxes.length; i++) {
		for (let j = i + 1; j < boxes.length; j++) {
			const A = boxes[i];
			const B = boxes[j];

			if (!A || !B) continue;

			// Calculate center positions
			const centerAX = A.x + A.width * 0.5;
			const centerAY = A.y + A.height * 0.5;
			const centerBX = B.x + B.width * 0.5;
			const centerBY = B.y + B.height * 0.5;

			// Calculate distance between centers
			const dx = Math.abs(centerAX - centerBX);
			const dy = Math.abs(centerAY - centerBY);

			// Calculate overlap
			const overlapX = (A.width + B.width) * 0.5 - dx;
			const overlapY = (A.height + B.height) * 0.5 - dy;

			// If there's overlap on both axes, we have a collision
			if (overlapX > 0 && overlapY > 0) {
				return true;
			}
		}
	}

	return false;
};

export const resolveCollisions: CollisionAlgorithm = (
	nodes,
	{ maxIterations = 50, overlapThreshold = 0.5, margin = 0 },
) => {
	const boxes = getBoxesFromNodes(nodes, margin);

	for (let iter = 0; iter <= maxIterations; iter++) {
		let moved = false;

		for (let i = 0; i < boxes.length; i++) {
			for (let j = i + 1; j < boxes.length; j++) {
				const A = boxes[i];
				const B = boxes[j];

				if (!A) continue;
				if (!B) continue;
				// Calculate center positions
				const centerAX = A.x + A.width * 0.5;
				const centerAY = A.y + A.height * 0.5;
				const centerBX = B.x + B.width * 0.5;
				const centerBY = B.y + B.height * 0.5;

				// Calculate distance between centers
				const dx = centerAX - centerBX;
				const dy = centerAY - centerBY;

				// Calculate overlap along each axis
				const px = (A.width + B.width) * 0.5 - Math.abs(dx);
				const py = (A.height + B.height) * 0.5 - Math.abs(dy);

				// Check if there's significant overlap
				if (px > overlapThreshold && py > overlapThreshold) {
					A.moved = B.moved = moved = true;
					// Resolve along the smallest overlap axis
					if (px < py) {
						// Move along x-axis
						const sx = dx > 0 ? 1 : -1;
						const moveAmount = px / 2;
						A.x += moveAmount * sx;
						B.x -= moveAmount * sx;
					} else {
						// Move along y-axis
						const sy = dy > 0 ? 1 : -1;
						const moveAmount = py / 2;
						A.y += moveAmount * sy;
						B.y -= moveAmount * sy;
					}
				}
			}
		}
		// Early exit if no overlaps were found
		if (!moved) {
			break;
		}
	}

	const newNodes = boxes.map((box) => {
		if (box.moved) {
			return {
				...box.node,
				position: {
					x: box.x + margin,
					y: box.y + margin,
				},
			};
		}
		return box.node;
	});

	return newNodes;
};
