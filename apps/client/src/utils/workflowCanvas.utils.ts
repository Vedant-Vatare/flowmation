import {
	createCanvasNode,
	getNodeColorByTask,
	getNodeUI,
	type WorkflowCanvasNode,
} from "@/constants/nodes";

type AddNodeFn = (node: WorkflowCanvasNode) => void;

let addNode: AddNodeFn | null = null;

export function registerAddNode(fn: AddNodeFn) {
	addNode = fn;
}

export function addNodeInCanvas(task: string) {
	if (!addNode) {
		console.warn("Canvas not mounted yet");
		return;
	}
	const node = createCanvasNode(task);
	addNode(node);
}

export { getNodeUI, getNodeColorByTask };
