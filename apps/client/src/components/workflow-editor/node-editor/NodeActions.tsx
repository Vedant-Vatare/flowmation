import {
	CopyCheck,
	CopyIcon,
	HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WorkflowNodeData } from "@/constants/nodes";
import { useExecuteWorkflow, usePublishStatus } from "@/queries/userWorkflows";

export const nodesWithActions = ["trigger.webhook", "trigger.click"] as const;
const ExecuteWorkflowOnPublishAction = ({
	nodeData,
}: {
	nodeData: WorkflowNodeData;
}) => {
	const { data: publishStatus } = usePublishStatus(nodeData.workflowId);
	const { mutate: executeWorkflow } = useExecuteWorkflow();
	if (publishStatus?.isPublished) {
		return (
			<Button
				variant="secondary"
				size={"lg"}
				className="w-[90%] mx-auto bg-success text-success-foreground mb-2"
				onClick={() =>
					executeWorkflow({
						workflowId: nodeData.workflowId,
						triggerNodeId: nodeData.id,
						triggerType: "trigger",
						liveUpdates: false,
					})
				}
			>
				Execute workflow now
			</Button>
		);
	} else {
		return (
			<p className="px-3 py-4 text-xs text-muted-foreground text-center italic">
				publish the workflow before exection
			</p>
		);
	}
};

const WebhookNodeAction = ({ nodeData }: { nodeData: WorkflowNodeData }) => {
	const [copied, setCopied] = useState(false);
	const url = `${import.meta.env.VITE_API_URL}/webhooks/${nodeData.id}`;

	const handleCopy = () => {
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="px-4 py-3 border-b border-border">
			<div className="flex items-center gap-1.5 mb-2">
				<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Webhook URL
				</Label>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-default">
							<HugeiconsIcon icon={HelpCircleIcon} size={16} />
						</span>
					</TooltipTrigger>
					<TooltipContent side="right" className="max-w-48 text-xs">
						Send a <span className="font-semibold">POST</span> request to this
						URL to trigger the workflow.
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="flex items-center gap-4 bg-muted/50 rounded-md border border-border px-2 py-2">
				<span className="flex-1 text-xs font-mono text-foreground break-all select-all">
					{url}
				</span>
				<Button size={"icon-sm"} variant={"ghost"} onClick={handleCopy}>
					{copied ? (
						<HugeiconsIcon
							icon={CopyCheck}
							size={15}
							className="text-success-foreground"
						/>
					) : (
						<HugeiconsIcon icon={CopyIcon} size={15} />
					)}
				</Button>
			</div>
		</div>
	);
};

export const NodeActions = ({ nodeData }: { nodeData: WorkflowNodeData }) => {
	switch (nodeData.task) {
		case "trigger.webhook":
			return WebhookNodeAction({ nodeData });
		case "trigger.click":
			return ExecuteWorkflowOnPublishAction({ nodeData });
		case "trigger.input":
			return ExecuteWorkflowOnPublishAction({ nodeData });
	}

	return null;
};
