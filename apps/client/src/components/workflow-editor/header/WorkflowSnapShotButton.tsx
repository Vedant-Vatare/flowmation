import {
	ChevronDown,
	CloudOff,
	Loading03Icon,
	Rocket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect } from "react";
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
import { usePublishStatusStore } from "@/store/workflow/useWorkflowStore";

export const WorkflowSnapShotButton = () => {
	const { workflowId } = Route.useParams();
	const { data: publishStatus, isLoading: isLoadingStatus } =
		usePublishStatus(workflowId);
	const { mutate: publishWorkflow, isPending: isPublishing } =
		usePublishWorkflow();
	const { mutate: unpublishWorkflow, isPending: isUnpublishing } =
		useUnpublishWorkflow();
	const hasDraftChanges = usePublishStatusStore((s) => s.hasDraftChanges);

	const isLoading = isPublishing || isUnpublishing;
	const isPublished = publishStatus?.isPublished ?? false;
	const canPublish = !isPublished || hasDraftChanges;
	const publishedClean = isPublished && !hasDraftChanges;

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				(e.metaKey || e.ctrlKey) &&
				e.shiftKey &&
				e.key.toLowerCase() === "d"
			) {
				e.preventDefault();
				if (!isLoading && canPublish) {
					publishWorkflow(workflowId);
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [publishWorkflow, workflowId, isLoading, canPublish]);

	if (isLoadingStatus) {
		return (
			<Button variant="secondary" size="sm" disabled className="min-w-30 gap-2">
				<HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
				Loading
			</Button>
		);
	}

	const getButtonContent = () => {
		if (isLoading) {
			return (
				<>
					<HugeiconsIcon
						icon={Loading03Icon}
						className="size-3.5 animate-spin"
					/>
					{isPublishing ? "Publishing" : "Unpublishing"}
				</>
			);
		}
		if (!isPublished) {
			return (
				<>
					<HugeiconsIcon icon={Rocket01Icon} className="size-3.5" />
					Publish
				</>
			);
		}
		if (hasDraftChanges) {
			return (
				<>
					<span className="inline-block size-1.5 rounded-full bg-amber-500" />
					Publish changes
				</>
			);
		}
		return (
			<>
				<HugeiconsIcon
					icon={Rocket01Icon}
					className="size-3.5 text-muted-foreground"
				/>
				Published
			</>
		);
	};

	const handlePublish = () => {
		if (!isLoading && canPublish) {
			publishWorkflow(workflowId);
		}
	};

	if (!isPublished) {
		return (
			<Button
				variant="default"
				size="sm"
				className="min-w-30 gap-2"
				disabled={isLoading}
				type="button"
				onClick={handlePublish}
			>
				{getButtonContent()}
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={publishedClean ? "ghost" : "outline"}
					size="sm"
					className={`min-w-30 gap-2 ${
						publishedClean
							? "text-muted-foreground hover:text-foreground"
							: "border-border text-muted-foreground hover:bg-muted"
					}`}
					disabled={isLoading}
					type="button"
				>
					{getButtonContent()}
					<HugeiconsIcon
						icon={ChevronDown}
						className="size-3.5 text-muted-foreground"
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{hasDraftChanges && (
					<DropdownMenuItem onClick={handlePublish} disabled={isLoading}>
						<HugeiconsIcon icon={Rocket01Icon} className="size-3.5" />
						Publish changes
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					onClick={() => unpublishWorkflow(workflowId)}
					disabled={isLoading}
					className="gap-2 text-destructive focus:text-destructive"
				>
					<HugeiconsIcon icon={CloudOff} className="size-3.5" />
					Unpublish
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
