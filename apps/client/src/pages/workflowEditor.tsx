import { ReactFlowProvider } from "@xyflow/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import WorkflowCanvas from "@/components/workflow-editor/canvas/WorkflowCanvas";
import { LiveExecutionLogs } from "@/components/workflow-editor/LiveExecutionPanel";
import { WorkflowEditorSidebar } from "@/components/workflow-editor/WorkflowEditorSidebar";
import { useWorkflowSidbarTabsStore } from "@/store/workflow/useWorkflowEditor";

export const WorkflowEditorPage = () => {
	const sidebarOpen = useWorkflowSidbarTabsStore((s) => s.sidebarOpen);
	const setSidebarOpen = useWorkflowSidbarTabsStore((s) => s.setSidebarOpen);

	return (
		<ReactFlowProvider>
			<div className="h-full w-full bg-card relative overflow-hidden">
				<SidebarProvider
					sidebarId="workflow-editor"
					defaultWidth={288}
					minWidth={240}
					maxWidth={350}
					collapseThreshold={170}
					className="w-full h-full absolute inset-0 min-h-0"
					open={sidebarOpen}
					onOpenChange={setSidebarOpen}
				>
					<WorkflowCanvas />
					<WorkflowEditorSidebar />
					<LiveExecutionLogs />
				</SidebarProvider>
			</div>
		</ReactFlowProvider>
	);
};
