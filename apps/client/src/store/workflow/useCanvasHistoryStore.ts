import type { Edge } from "@xyflow/react";
import { create } from "zustand";

type NodeSnapshot = {
	id: string;
	positionX: number;
	positionY: number;
};

type EdgeSnapshot = {
	id: string;
	source: string;
	target: string;
	sourceHandle: string;
	targetHandle: string;
};

export type CanvasSnapshot = {
	nodes: NodeSnapshot[];
	edges: EdgeSnapshot[];
};

const MAX_HISTORY = 50;

type CanvasHistoryStore = {
	undoStack: CanvasSnapshot[];
	redoStack: CanvasSnapshot[];
	pushSnapshot: (snapshot: CanvasSnapshot) => void;
	undo: (currentState: CanvasSnapshot) => CanvasSnapshot | null;
	redo: (currentState: CanvasSnapshot) => CanvasSnapshot | null;
	clear: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
};

function edgeToSnapshot(e: Edge): EdgeSnapshot {
	return {
		id: e.id,
		source: e.source,
		target: e.target,
		sourceHandle: e.sourceHandle ?? "default",
		targetHandle: e.targetHandle ?? "default",
	};
}

export function captureSnapshot(
	nodes: Array<{ id: string; position: { x: number; y: number } }>,
	edges: Edge[],
): CanvasSnapshot {
	return {
		nodes: nodes.map((n) => ({
			id: n.id,
			positionX: Math.round(n.position.x),
			positionY: Math.round(n.position.y),
		})),
		edges: edges.map(edgeToSnapshot),
	};
}

export const useCanvasHistoryStore = create<CanvasHistoryStore>((set, get) => ({
	undoStack: [],
	redoStack: [],

	pushSnapshot: (snapshot) => {
		set((state) => {
			const undoStack = [...state.undoStack, snapshot];
			if (undoStack.length > MAX_HISTORY) undoStack.shift();
			return { undoStack, redoStack: [] };
		});
	},

	undo: (currentState) => {
		const state = get();
		const { undoStack } = state;
		if (undoStack.length === 0) return null;

		const snapshot = undoStack[undoStack.length - 1] as CanvasSnapshot;
		set((s) => ({
			undoStack: s.undoStack.slice(0, -1),
			redoStack: [...s.redoStack, currentState],
		}));
		return snapshot;
	},

	redo: (currentState) => {
		const state = get();
		const { redoStack } = state;
		if (redoStack.length === 0) return null;

		const snapshot = redoStack[redoStack.length - 1] as CanvasSnapshot;
		set((s) => ({
			redoStack: s.redoStack.slice(0, -1),
			undoStack: [...s.undoStack, currentState],
		}));
		return snapshot;
	},

	clear: () => set({ undoStack: [], redoStack: [] }),

	canUndo: () => get().undoStack.length > 0,
	canRedo: () => get().redoStack.length > 0,
}));
