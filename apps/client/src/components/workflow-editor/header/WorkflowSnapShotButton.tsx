import { Check, CloudUpload, Loader2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	usePublishStatus,
	usePublishWorkflow,
	useUnpublishWorkflow,
} from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";

export const WorkflowSnapShotButton = () => {
	const { workflowId } = Route.useParams();
	const { data: publishStatus, isLoading } = usePublishStatus(workflowId);
	const { mutate: publishWorkflow, isPending: isPublishing } =
		usePublishWorkflow();
	const { mutate: unpublishWorkflow, isPending: isUnpublishing } =
		useUnpublishWorkflow();

	const isBusy = isPublishing || isUnpublishing;

	if (isLoading) {
		return (
			<Button variant="secondary" size="sm" disabled className="gap-2">
				<Loader2 className="size-3.5 animate-spin" />
			</Button>
		);
	}

	const isPublished = publishStatus?.isPublished ?? false;
	const hasDraftChanges = publishStatus?.hasDraftChanges ?? false;

	if (!isPublished) {
		return (
			<Button
				variant="default"
				size="sm"
				className="gap-2"
				onClick={() => publishWorkflow(workflowId)}
				disabled={isBusy}
				title="Publish this workflow to make it live"
				type="button"
			>
				{isPublishing ? (
					<Loader2 className="size-3.5 animate-spin" />
				) : (
					<CloudUpload className="size-3.5" />
				)}
				Publish
			</Button>
		);
	}

	if (hasDraftChanges) {
		return (
			<Button
				variant="default"
				size="sm"
				className="gap-2 border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
				onClick={() => publishWorkflow(workflowId)}
				disabled={isBusy}
				title="Publish your changes to update the live workflow"
				type="button"
			>
				{isPublishing ? (
					<Loader2 className="size-3.5 animate-spin" />
				) : (
					<CloudUpload className="size-3.5" />
				)}
				Publish changes
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="secondary"
					size="sm"
					className="gap-2 rounded-[calc(0.5rem-1.5px)] border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
					disabled={isBusy}
					type="button"
				>
					<Check className="size-3.5 text-green-500" />
					Published
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => unpublishWorkflow(workflowId)}
					disabled={isBusy}
					className="gap-2 text-destructive focus:text-destructive"
				>
					<Unplug className="size-3.5" />
					Unpublish
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
