import { create } from "zustand";

type WorkflowSidebarTabs = "editor" | "nodes" | "runs";
type WorkflowSidebarTabsStore = {
	tabOpen: WorkflowSidebarTabs;
	setTabOpen: (state: WorkflowSidebarTabs) => void;
};

export const useWorkflowSidbarTabsStore = create<WorkflowSidebarTabsStore>(
	(set) => ({
		tabOpen: "nodes",
		setTabOpen: (newTab: WorkflowSidebarTabs) => set({ tabOpen: newTab }),
	}),
);
