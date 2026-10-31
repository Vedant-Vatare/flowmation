import { useMatch } from "@tanstack/react-router";
import { WorkflowSettings } from "./WorkflowSettings";
import { WorkflowSnapShotButton } from "./WorkflowSnapShotButton";
export const WorkflowHeaderActions = () => {
	const match = useMatch({
		from: "/_mainLayout/workflow/$workflowId",
		shouldThrow: false,
	});
	const workflowId = match?.params?.workflowId;
	if (!workflowId) return null;

	return (
		<div className="flex shrink-0 items-center gap-1.5">
			<WorkflowSettings key={workflowId} workflowId={workflowId} />
			<WorkflowSnapShotButton />
		</div>
	);
};
