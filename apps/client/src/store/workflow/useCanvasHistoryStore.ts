import type { WorkflowNode } from "@nodebase/shared";
import { create } from "zustand";

type EdgeSnapshot = {
	id: string;
	source: string;
	target: string;
	sourceHandle: string;
	targetHandle: string;
};

export type CanvasSnapshot = {
	nodes: WorkflowNode[];
	edges: EdgeSnapshot[];
};

const MAX_HISTORY = 50;

type CanvasHistoryStore = {
	historyCheckPending: boolean;
	setHistoryCheckPending: (pending: boolean) => void;
	restoringWorkflowId: string | null;
	setRestoringWorkflowId: (workflowId: string | null) => void;
	undoStack: CanvasSnapshot[];
	redoStack: CanvasSnapshot[];
	pushSnapshot: (snapshot: CanvasSnapshot) => void;
	undo: (currentState: CanvasSnapshot) => CanvasSnapshot | null;
	redo: (currentState: CanvasSnapshot) => CanvasSnapshot | null;
	clear: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
};

export const useCanvasHistoryStore = create<CanvasHistoryStore>((set, get) => ({
	historyCheckPending: false,
	setHistoryCheckPending: (historyCheckPending) => set({ historyCheckPending }),
	restoringWorkflowId: null,
	setRestoringWorkflowId: (restoringWorkflowId) => set({ restoringWorkflowId }),
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
