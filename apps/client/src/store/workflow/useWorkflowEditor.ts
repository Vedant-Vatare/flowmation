import { create } from "zustand";

type WorkflowSidebarTabs = "editor" | "nodes" | "runs";
type NodePlacement = {
	workflowId: string;
	position: { x: number; y: number };
	connectionId?: string;
};

type WorkflowSidebarTabsStore = {
	placement: NodePlacement | null;
	setPlacement: (placement: NodePlacement | null) => void;
	tabOpen: WorkflowSidebarTabs;
	setTabOpen: (state: WorkflowSidebarTabs) => void;
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
};

export const useWorkflowSidbarTabsStore = create<WorkflowSidebarTabsStore>(
	(set) => ({
		placement: null,
		setPlacement: (placement) => set({ placement }),
		tabOpen: "nodes",
		setTabOpen: (newTab: WorkflowSidebarTabs) => set({ tabOpen: newTab }),
		sidebarOpen: true,
		setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
	}),
);
