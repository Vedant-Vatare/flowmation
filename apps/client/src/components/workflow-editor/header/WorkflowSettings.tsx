import type { WorkflowNode } from "@nodebase/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	Download,
	Link,
	Settings2,
	SlidersHorizontal,
	Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	deleteUserWorkflowApi,
	exportUserWorkflowApi,
} from "@/apis/userWorkflow";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	useUpdateUserWorkflow,
	useUserWorkflowQuery,
} from "@/queries/userWorkflows";
import { useCanvasHistoryStore } from "@/store/workflow/useCanvasHistoryStore";
import {
	usePublishStatusStore,
	useWebhookStore,
	useWorkflowExecutionStore,
	useWorkflowStore,
} from "@/store/workflow/useWorkflowStore";
import { getErrorMessage } from "@/utils/error";

const neutralButton =
	"bg-foreground text-background hover:bg-foreground/90 [background-image:none] focus-visible:border-foreground/50 focus-visible:ring-foreground/30";
const neutralOutline =
	"hover:bg-muted hover:text-foreground dark:hover:bg-muted focus-visible:border-foreground/50 focus-visible:ring-foreground/30";
const menuItem = "min-h-9 cursor-pointer focus:bg-muted focus:text-foreground";

export function WorkflowSettings({ workflowId }: { workflowId: string }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: workflows } = useUserWorkflowQuery();
	const workflow = workflows?.find((item) => item.id === workflowId);
	const update = useUpdateUserWorkflow();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [panel, setPanel] = useState<"details" | "delete" | null>(null);
	const [contentPanel, setContentPanel] = useState<"details" | "delete">(
		"details",
	);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [error, setError] = useState("");

	const refreshLists = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ["user-workflows"] }),
			queryClient.invalidateQueries({ queryKey: ["dashboard-workflows"] }),
		]);
	const deletion = useMutation({
		mutationFn: () => deleteUserWorkflowApi(workflowId),
		onSuccess: async () => {
			await navigate({ to: "/dashboard" });
			const nodes =
				queryClient.getQueryData<WorkflowNode[]>([
					"workflow-nodes",
					{ workflowId },
				]) ?? [];
			for (const node of nodes)
				useWorkflowStore.getState().clearNodeDraft(node.id);
			useWorkflowStore.getState().setSelectedNodeId(null);
			usePublishStatusStore.getState().setSnapshot(null, null);
			useWorkflowExecutionStore.getState().clearExecutionUpdates();
			useWebhookStore.getState().clearTestWebhook();
			useCanvasHistoryStore.getState().clear();
			await refreshLists();
			queryClient.removeQueries({
				predicate: (query) =>
					query.queryKey.some(
						(key) =>
							typeof key === "object" &&
							key !== null &&
							"workflowId" in key &&
							key.workflowId === workflowId,
					),
			});
			void queryClient.invalidateQueries({ queryKey: ["execution-logs"] });
			toast.success("Workflow deleted");
		},
		onError: (failure) => {
			setError(getErrorMessage(failure));
			void queryClient.invalidateQueries({
				queryKey: ["publishStatus", { workflowId }],
			});
			void refreshLists();
		},
	});
	const exporting = useMutation({
		mutationFn: () => exportUserWorkflowApi(workflowId),
		onSuccess: (data) => {
			const url = URL.createObjectURL(
				new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
			);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${data.name.replace(/[^a-z0-9_-]/gi, "_") || "workflow"}.flowmation.json`;
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			toast.success(
				"Workflow exported. Review values entered in nodes before sharing.",
			);
		},
		onError: (failure) => toast.error(getErrorMessage(failure)),
	});
	const busy = deletion.isPending || update.isPending;
	const open = (next: NonNullable<typeof panel>) => {
		setError("");
		setName(workflow?.name ?? "");
		setDescription(workflow?.description ?? "");
		setConfirmation("");

		setContentPanel(next);
		setPanel(next);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						ref={triggerRef}
						type="button"
						variant="ghost"
						size="sm"
						aria-label="Workflow settings"
						title="Workflow settings"
						disabled={!workflow || busy}
						className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted data-[state=open]:bg-muted data-[state=open]:text-foreground focus-visible:border-foreground/50 focus-visible:ring-foreground/30 sm:w-auto sm:px-2.5"
					>
						<Settings2 aria-hidden="true" className="size-4" />
						<span className="hidden sm:inline">Settings</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" sideOffset={8} className="w-64">
					<DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
						Workflow settings
					</DropdownMenuLabel>
					<DropdownMenuItem
						className={menuItem}
						onSelect={() => open("details")}
					>
						<SlidersHorizontal />
						Workflow details
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className={menuItem}
						disabled={exporting.isPending}
						onSelect={() => exporting.mutate()}
					>
						<Download />
						{exporting.isPending ? "Exporting…" : "Export JSON"}
					</DropdownMenuItem>
					<DropdownMenuItem
						className={menuItem}
						onSelect={async () => {
							try {
								await navigator.clipboard.writeText(window.location.href);
								toast.success("Workflow link copied");
							} catch {
								toast.error(
									"Could not copy the link. Copy it from your address bar.",
								);
							}
						}}
					>
						<Link />
						Copy workflow link
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="min-h-9 cursor-pointer"
						variant="destructive"
						onSelect={() => open("delete")}
					>
						<Trash2 />
						Delete workflow
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog
				open={panel !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen && !busy) {
						setPanel(null);
					}
				}}
			>
				<DialogContent
					showCloseButton={!busy}
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						triggerRef.current?.focus();
					}}
					className="max-h-[calc(100svh-2rem)] overflow-y-auto"
				>
					<DialogHeader>
						<DialogTitle>
							{contentPanel === "details"
								? "Workflow details"
								: "Permanently delete workflow?"}
						</DialogTitle>
						<DialogDescription>
							{contentPanel === "details" ? (
								"Edit the name and description."
							) : (
								<>
									Permanently delete{" "}
									<span className="font-medium break-words text-foreground">
										{workflow?.name}
									</span>
									? This cannot be undone.
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<form
						className="grid gap-4"
						onSubmit={(event) => {
							event.preventDefault();
							if (busy) return;
							setError("");
							if (contentPanel === "details" && name.trim())
								update.mutate(
									{
										workflowId,
										data: {
											name: name.trim(),
											description: description.trim(),
										},
									},
									{
										onSuccess: () => {
											setPanel(null);
											toast.success("Workflow details saved");
										},
										onError: (failure) => setError(getErrorMessage(failure)),
									},
								);
							if (contentPanel === "delete" && confirmation === workflow?.name)
								deletion.mutate();
						}}
					>
						{contentPanel === "details" && (
							<>
								<div className="grid gap-2">
									<Label htmlFor="workflow-settings-name">Name</Label>
									<Input
										id="workflow-settings-name"
										value={name}
										onChange={(event) => setName(event.target.value)}
										maxLength={255}
										required
										disabled={busy}
										className="focus-visible:border-foreground/50 focus-visible:ring-foreground/30"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="workflow-settings-description">
										Description{" "}
										<span className="font-normal text-muted-foreground">
											(optional)
										</span>
									</Label>
									<Textarea
										id="workflow-settings-description"
										value={description}
										onChange={(event) => setDescription(event.target.value)}
										maxLength={10000}
										rows={3}
										disabled={busy}
										className="resize-y focus-visible:border-foreground/50 focus-visible:ring-foreground/30"
									/>
								</div>
							</>
						)}
						{contentPanel === "delete" && (
							<div className="grid gap-2">
								<Label htmlFor="workflow-delete-confirmation">
									Type the workflow name to confirm
								</Label>
								<Input
									id="workflow-delete-confirmation"
									value={confirmation}
									onChange={(event) => setConfirmation(event.target.value)}
									autoComplete="off"
									disabled={busy}
									className="focus-visible:border-foreground/50 focus-visible:ring-foreground/30"
								/>
							</div>
						)}
						{error && (
							<p role="alert" className="text-sm text-destructive">
								{error}
							</p>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								className={neutralOutline}
								disabled={busy}
								onClick={() => {
									setPanel(null);
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant={
									contentPanel === "delete" ? "destructive" : "secondary"
								}
								className={contentPanel === "delete" ? "" : neutralButton}
								disabled={
									busy ||
									(contentPanel === "details"
										? !name.trim()
										: confirmation !== workflow?.name)
								}
							>
								{contentPanel === "details"
									? update.isPending
										? "Saving…"
										: "Save changes"
									: deletion.isPending
										? "Deleting…"
										: "Delete permanently"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
