import { useMatch } from "@tanstack/react-router";
import { WorkflowSnapShotButton } from "./WorkflowSnapShotButton";
export const WorkflowHeaderActions = () => {
	const match = useMatch({
		from: "/_mainLayout/workflow/$workflowId",
		shouldThrow: false,
	});
	const workflowId = match?.params?.workflowId;
	if (!workflowId) return null;

	return <WorkflowSnapShotButton />;
};
