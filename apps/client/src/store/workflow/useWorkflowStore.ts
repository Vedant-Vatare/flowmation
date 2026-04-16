import type { NodeExecutionUpdate } from "@nodebase/shared";
import { create } from "zustand";
import type { WorkflowCanvasNode } from "@/constants/nodes";

type WorkflowTriggerNode = {
	id: string;
	workflowId: string;
	task: string;
	name: string;
};

type WorkflowStore = {
	selectedNode: WorkflowCanvasNode | null;
	setSelectedNode: (node: WorkflowCanvasNode) => void;
	clearSelectedNode: () => void;
	triggerNodes: WorkflowTriggerNode[];
	setTriggerNodes: (nodes: WorkflowTriggerNode[]) => void;
	isSelectingTriggerForExecution: boolean;
	setIsSelectingTriggerForExecution: (value: boolean) => void;
	executionTriggerFocusRequestKey: number;
	requestExecutionTriggerFocus: () => void;
};
type WorkflowExecutionStore = {
	showExecutionUpdates: boolean;
	setShowExecutionUpdates: (state: boolean) => void;
	nodeExecutionUpdates: NodeExecutionUpdate[];
	addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
	selectedNode: null,
	setSelectedNode: (node: WorkflowCanvasNode) => set({ selectedNode: node }),
	clearSelectedNode: () => set({ selectedNode: null }),

	triggerNodes: [],
	setTriggerNodes: (nodes) => set({ triggerNodes: nodes }),

	isSelectingTriggerForExecution: false,
	setIsSelectingTriggerForExecution: (value) =>
		set({ isSelectingTriggerForExecution: value }),

	executionTriggerFocusRequestKey: 0,
	requestExecutionTriggerFocus: () =>
		set((state) => ({
			executionTriggerFocusRequestKey:
				state.executionTriggerFocusRequestKey + 1,
		})),
}));

export const useWorkflowExecutionStore = create<WorkflowExecutionStore>(
	(set) => ({
		showExecutionUpdates: false,
		setShowExecutionUpdates: (state: boolean) =>
			set({ showExecutionUpdates: state }),

		nodeExecutionUpdates: [],
		addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) =>
			set((state) => ({
				nodeExecutionUpdates: [...state.nodeExecutionUpdates, executionUpdate],
			})),
	}),
);
