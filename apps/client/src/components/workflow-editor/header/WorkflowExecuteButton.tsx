import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/ui/shine-border";
import { useTestWorkflowExecution } from "@/hooks/useWorkflow";
import { useWorkflowNodesQuery } from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import {
	useWorkflowExecutionStore,
	useWorkflowTriggerStore,
} from "@/store/workflow/useWorkflowStore";

export const WorkflowExecuteButton = () => {
	const { workflowId } = Route.useParams();
	const { data: workflowNodes } = useWorkflowNodesQuery(workflowId);
	const { executeTriggerNode } = useTestWorkflowExecution();
	const isSelectingTrigger = useWorkflowTriggerStore(
		(s) => s.isSelectingTrigger,
	);
	const setIsSelectingTrigger = useWorkflowTriggerStore(
		(s) => s.setIsSelectingTrigger,
	);
	const requestTriggerFocus = useWorkflowTriggerStore(
		(s) => s.requestTriggerFocus,
	);
	const clearExecutionUpdates = useWorkflowExecutionStore(
		(s) => s.clearExecutionUpdates,
	);

	const handleExecute = () => {
		const triggerNodes =
			workflowNodes?.filter((n) => n.type === "trigger") ?? [];
		clearExecutionUpdates();

		if (triggerNodes.length === 0) {
			toast.info("Add a trigger node in canvas to execute workflow.");
			return;
		}

		if (triggerNodes.length === 1) {
			const trigger = triggerNodes[0];
			if (!trigger) return;
			executeTriggerNode(trigger);
			setIsSelectingTrigger(false);
			return;
		}

		setIsSelectingTrigger(!isSelectingTrigger);
		requestTriggerFocus();
	};

	return (
		<ShineBorder
			className="rounded-md"
			borderWidth={2}
			duration={3.5}
			color="hsl(var(--primary))"
			disabled={isSelectingTrigger}
		>
			<Button
				size="sm"
				className="min-w-32 gap-2 rounded-md bg-primary text-primary-foreground"
				onClick={handleExecute}
				type="button"
			>
				<Play className="size-4" />
				Execute
			</Button>
		</ShineBorder>
	);
};
