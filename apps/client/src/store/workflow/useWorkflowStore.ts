import type { NodeExecutionUpdate } from "@nodebase/shared";
import { create } from "zustand";
import type { WorkflowCanvasNode } from "@/constants/nodes";

type WorkflowStore = {
	selectedNode: WorkflowCanvasNode | null;
	setSelectedNode: (node: WorkflowCanvasNode | null) => void;
};

type WorkflowTriggerStore = {
	isSelectingTrigger: boolean;
	setIsSelectingTrigger: (value: boolean) => void;
	triggerFocusRequestKey: number;
	requestTriggerFocus: () => void;
};

type WorkflowExecutionStore = {
	showExecutionUpdates: boolean;
	setShowExecutionUpdates: (state: boolean) => void;
	nodeExecutionUpdates: Record<string, NodeExecutionUpdate>;
	addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) => void;
	clearExecutionUpdates: () => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
	selectedNode: null,
	setSelectedNode: (node) => set({ selectedNode: node }),
}));

export const useWorkflowTriggerStore = create<WorkflowTriggerStore>((set) => ({
	isSelectingTrigger: false,
	setIsSelectingTrigger: (value) => set({ isSelectingTrigger: value }),

	triggerFocusRequestKey: 0,
	requestTriggerFocus: () =>
		set((state) => ({
			triggerFocusRequestKey: state.triggerFocusRequestKey + 1,
		})),
}));

export const useWorkflowExecutionStore = create<WorkflowExecutionStore>(
	(set) => ({
		showExecutionUpdates: false,
		setShowExecutionUpdates: (state: boolean) =>
			set({ showExecutionUpdates: state }),

		nodeExecutionUpdates: {},
		addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) =>
			set((state) => ({
				nodeExecutionUpdates: {
					...state.nodeExecutionUpdates,
					[executionUpdate.nodeId]: executionUpdate,
				},
			})),

		clearExecutionUpdates: () => {
			set({ showExecutionUpdates: false, nodeExecutionUpdates: {} });
		},
	}),
);
