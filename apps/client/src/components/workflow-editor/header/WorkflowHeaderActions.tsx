import { useMatch } from "@tanstack/react-router";
import { WorkflowExecuteButton } from "@/components/workflow-editor/header/WorkflowExecuteButton";

export const WorkflowHeaderActions = () => {
	const isWorkflowEditor = useMatch({
		from: "/_mainLayout/workflow/$workflowId",
		shouldThrow: false,
	});

	if (!isWorkflowEditor) {
		return null;
	}

	return (
		<div className="animate-in fade-in slide-in-from-top-2 duration-300">
			<WorkflowExecuteButton />
		</div>
	);
};
