import type { HumanReviewDecision, PendingHumanReview } from "@nodebase/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ClipboardCheck } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import {
	decideHumanReviewApi,
	getPendingHumanReviewsApi,
} from "@/apis/userWorkflow";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/utils/datetime";
import { getErrorMessage } from "@/utils/error";

function ReviewDialog({
	review,
	onClose,
}: {
	review: PendingHumanReview;
	onClose?: () => void;
}) {
	const [open, setOpen] = useState(Boolean(onClose));
	const [editing, setEditing] = useState(false);
	const [note, setNote] = useState("");
	const [inputError, setInputError] = useState("");
	const contentId = useId();
	const noteId = useId();
	const focusEditor = useCallback((input: HTMLTextAreaElement | null) => {
		input?.focus();
	}, []);
	const isText = typeof review.content === "string";
	const original =
		typeof review.content === "string"
			? review.content
			: JSON.stringify(review.content, null, 2);
	const [content, setContent] = useState(original);
	const queryClient = useQueryClient();
	const refreshReviews = () => {
		void queryClient.invalidateQueries({ queryKey: ["human-reviews"] });
		void queryClient.invalidateQueries({ queryKey: ["execution-logs"] });
		void queryClient.invalidateQueries({
			queryKey: ["workflow-node-outputs", { workflowId: review.workflowId }],
		});
	};
	const mutation = useMutation({
		mutationFn: (decision: HumanReviewDecision) =>
			decideHumanReviewApi(review.executionId, review.id, decision),
		onSuccess: (_data, decision) => {
			setOpen(false);
			toast.success(
				decision.decision === "approved" ? "Approval saved" : "Decline saved",
			);
			refreshReviews();
		},
		onError: (error) => {
			if (!isAxiosError(error) || error.response?.status !== 409) return;
			toast.info("This review is no longer pending.");
			setOpen(false);
			refreshReviews();
		},
	});

	const changeOpen = (next: boolean) => {
		if (mutation.isPending) return;
		setOpen(next);
		if (next) {
			setEditing(false);
			setContent(original);
			setNote("");
			setInputError("");
			mutation.reset();
		}
	};

	const submit = (decision: HumanReviewDecision["decision"]) => {
		setInputError("");
		const response: HumanReviewDecision = { decision, note };
		if (decision === "approved" && editing && content !== original) {
			try {
				response.content = isText ? content : JSON.parse(content);
			} catch {
				setInputError("Enter valid JSON to approve with changes.");
				return;
			}
		}
		mutation.mutate(response);
	};

	return (
		<Dialog open={open} onOpenChange={changeOpen}>
			{!onClose && (
				<DialogTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						aria-label={`Review ${review.nodeName}`}
					>
						Review
					</Button>
				</DialogTrigger>
			)}
			<DialogContent
				className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
				onCloseAutoFocus={
					onClose
						? (event) => {
								event.preventDefault();
								onClose();
							}
						: undefined
				}
			>
				<DialogHeader>
					<DialogTitle>{review.nodeName}</DialogTitle>
					<DialogDescription>
						{review.workflowName ?? "Untitled workflow"} · Run started{" "}
						{new Date(review.runStartedAt).toLocaleString()}
					</DialogDescription>
				</DialogHeader>
				<p className="whitespace-pre-wrap break-words text-sm">
					{review.message}
				</p>
				<div className="grid min-w-0 gap-2">
					<div className="flex items-center justify-between gap-2">
						{editing ? (
							<label htmlFor={contentId} className="text-sm font-medium">
								{isText ? "Content to review" : "Content to review (JSON)"}
							</label>
						) : (
							<span className="text-sm font-medium">Content to review</span>
						)}
						{review.allowEdits && !editing && (
							<Button
								type="button"
								size="xs"
								variant="ghost"
								onClick={() => setEditing(true)}
							>
								Edit content
							</Button>
						)}
					</div>
					{editing ? (
						<Textarea
							id={contentId}
							ref={focusEditor}
							value={content}
							disabled={mutation.isPending}
							onChange={(event) => setContent(event.target.value)}
							className="min-h-28 font-mono text-xs"
						/>
					) : (
						<pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/50 p-3 font-mono text-xs">
							{original || "No content submitted"}
						</pre>
					)}
				</div>
				<div className="grid gap-2">
					<label htmlFor={noteId} className="text-sm font-medium">
						Reviewer note (optional)
					</label>
					<Textarea
						id={noteId}
						value={note}
						maxLength={4000}
						disabled={mutation.isPending}
						onChange={(event) => setNote(event.target.value)}
					/>
				</div>
				{(inputError || mutation.error) && (
					<p role="alert" className="text-sm text-destructive">
						{inputError || getErrorMessage(mutation.error)}
					</p>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						disabled={mutation.isPending}
						onClick={() => submit("declined")}
					>
						{review.onDecline === "stop"
							? "Decline and stop"
							: "Decline and continue"}
					</Button>
					<Button
						disabled={mutation.isPending}
						onClick={() => submit("approved")}
					>
						Approve and continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function usePendingHumanReviews(workflowId?: string) {
	return useQuery({
		queryKey: ["human-reviews", { workflowId }],
		queryFn: () => getPendingHumanReviewsApi(workflowId),
		refetchInterval: 5000,
	});
}

export function WorkflowHeaderReviews({ workflowId }: { workflowId: string }) {
	const { data } = usePendingHumanReviews(workflowId);
	const [selected, setSelected] = useState<PendingHumanReview>();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const openingReview = useRef(false);
	const reviews = data ?? [];
	const count = reviews.length;
	const label = `Needs review · ${count}`;

	return (
		<>
			{count === 1 && (
				<Button
					ref={triggerRef}
					size="xs"
					variant="outline"
					onClick={() => setSelected(reviews[0])}
				>
					{label}
				</Button>
			)}
			{count > 1 && (
				<Popover>
					<PopoverTrigger asChild>
						<Button ref={triggerRef} size="xs" variant="outline">
							{label}
						</Button>
					</PopoverTrigger>
					<PopoverContent
						align="end"
						aria-label="Pending reviews for this workflow"
						className="w-80 max-w-[calc(100vw-2rem)] p-0"
						onCloseAutoFocus={(event) => {
							if (openingReview.current) event.preventDefault();
						}}
					>
						<h2 className="border-b px-3 py-2 text-sm font-medium">
							Pending reviews
						</h2>
						<ul className="max-h-72 divide-y overflow-y-auto">
							{reviews.map((review) => (
								<li key={review.id}>
									<PopoverPrimitive.Close asChild>
										<button
											type="button"
											className="grid w-full min-w-0 gap-1 px-3 py-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
											onClick={() => {
												openingReview.current = true;
												setSelected(review);
											}}
										>
											<span className="truncate text-sm font-medium">
												{review.nodeName}
											</span>
											<time
												dateTime={review.runStartedAt}
												className="text-xs text-muted-foreground"
											>
												{new Date(review.runStartedAt).toLocaleString()}
											</time>
											<span className="truncate text-xs text-muted-foreground">
												{review.message}
											</span>
										</button>
									</PopoverPrimitive.Close>
								</li>
							))}
						</ul>
					</PopoverContent>
				</Popover>
			)}
			{selected && (
				<ReviewDialog
					key={selected.id}
					review={selected}
					onClose={() => {
						openingReview.current = false;
						setSelected(undefined);
						triggerRef.current?.focus();
					}}
				/>
			)}
		</>
	);
}

export function PendingHumanReviews({ workflowId }: { workflowId?: string }) {
	const { data, isError } = usePendingHumanReviews(workflowId);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!workflowId && data) {
			void queryClient.invalidateQueries({ queryKey: ["execution-logs"] });
		}
	}, [data, queryClient, workflowId]);

	if (isError && !data)
		return (
			<p role="alert" className="text-sm text-destructive">
				Could not load pending reviews.
			</p>
		);
	if (!data?.length) return null;
	return (
		<section aria-label="Pending reviews" className="rounded-md border">
			<h2 className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">
				<ClipboardCheck
					className="size-4 text-muted-foreground"
					aria-hidden="true"
				/>
				Pending reviews
			</h2>
			<ul className="divide-y border-t">
				{data.map((review) => (
					<li
						key={review.id}
						className="flex items-center justify-between gap-3 px-4 py-2.5"
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{review.nodeName}</p>
							<p className="truncate text-xs text-muted-foreground">
								{review.workflowName ?? "Untitled workflow"} · Run started{" "}
								{formatRelativeTime(new Date(review.runStartedAt))}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{review.message}
							</p>
						</div>
						<ReviewDialog review={review} />
					</li>
				))}
			</ul>
		</section>
	);
}
