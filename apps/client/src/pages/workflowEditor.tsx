import { SidebarProvider } from "@/components/ui/sidebar";
import WorkflowCanvas from "@/components/workflow-editor/canvas";
import { WorkflowEditorSidebar } from "@/components/workflow-editor/workflowEditorSidebar";

export const WorkflowEditorPage = () => {
	return (
		<div className="h-screen bg-card">
			<SidebarProvider
				defaultOpen={true}
				className="w-full h-full"
				style={
					{
						"--sidebar-width": "16rem",
						"--sidebar-width-mobile": "20rem",
						"--sidebar-width-max": "16rem",
					} as React.CSSProperties
				}
			>
				<WorkflowCanvas />
				<WorkflowEditorSidebar />
			</SidebarProvider>
		</div>
	);
};
