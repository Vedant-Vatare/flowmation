import { FileUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type WorkflowFile, workflowFileSchema } from "@nodebase/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { importUserWorkflowApi } from "@/apis/userWorkflow";
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
import { getErrorMessage } from "@/utils/error";

const neutralOutline =
	"hover:bg-muted hover:text-foreground dark:hover:bg-muted focus-visible:border-foreground/50 focus-visible:ring-foreground/30";
export function WorkflowImportButton() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const [file, setFile] = useState<WorkflowFile | null>(null);
	const [fileError, setFileError] = useState("");
	const [reading, setReading] = useState(false);
	const [error, setError] = useState("");
	const readVersion = useRef(0);
	const refreshLists = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ["user-workflows"] }),
			queryClient.invalidateQueries({ queryKey: ["dashboard-workflows"] }),
		]);
	const importing = useMutation({
		mutationFn: importUserWorkflowApi,
		onSuccess: async (created) => {
			await refreshLists();
			setOpen(false);
			await navigate({
				to: "/workflow/$workflowId",
				params: { workflowId: created.id },
			});
			toast.success(
				"Workflow imported as a draft. Reconnect credentials before publishing.",
			);
		},
		onError: (failure) => setError(getErrorMessage(failure)),
	});

	const busy = importing.isPending;
	const chooseFile = async (selected?: File) => {
		if (busy) return;
		const version = ++readVersion.current;
		setFile(null);
		setFileError("");
		setError("");
		if (!selected) return;
		if (selected.size > 10 * 1024 * 1024) {
			setFileError("Choose a JSON file up to 10 MB.");
			return;
		}
		setReading(true);
		try {
			const result = workflowFileSchema.safeParse(
				JSON.parse(await selected.text()),
			);
			if (version !== readVersion.current) return;
			if (!result.success) {
				setFileError(
					"This file is not a valid Flowmation workflow (version 1).",
				);
				return;
			}
			setFile(result.data);
		} catch {
			if (version === readVersion.current)
				setFileError("Could not read this file. Choose a valid JSON export.");
		} finally {
			if (version === readVersion.current) setReading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (busy) return;
				readVersion.current++;
				setReading(false);
				setDragging(false);
				setFile(null);
				setFileError("");
				setError("");
				setOpen(next);
			}}
		>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" className={neutralOutline}>
					<FileUp aria-hidden="true" />
					Import
				</Button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={!busy}
				className="max-h-[calc(100svh-2rem)] overflow-y-auto"
			>
				<DialogHeader>
					<DialogTitle>Import workflow</DialogTitle>
					<DialogDescription>
						Create a new draft from a JSON file.
					</DialogDescription>
				</DialogHeader>
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (file && !busy && !reading) importing.mutate(file);
					}}
				>
					<div className="grid gap-3">
						<section
							aria-label="Upload workflow JSON"
							onDragOver={(event) => {
								event.preventDefault();
								if (!busy) setDragging(true);
							}}
							onDragLeave={(event) => {
								if (!event.currentTarget.contains(event.relatedTarget as Node))
									setDragging(false);
							}}
							onDrop={(event) => {
								event.preventDefault();
								setDragging(false);
								if (busy) return;
								if (event.dataTransfer.files.length !== 1) {
									setFileError("Choose one JSON file.");
									return;
								}
								void chooseFile(event.dataTransfer.files[0]);
							}}
							className={`flex flex-col items-center rounded-lg border border-dashed px-5 py-8 text-center transition-colors ${dragging ? "border-foreground/60 bg-muted" : "border-foreground/20 bg-muted/20"}`}
						>
							<HugeiconsIcon
								icon={FileUploadIcon}
								size={32}
								strokeWidth={1.5}
								className="mb-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<p
								className="max-w-full break-words text-sm font-medium"
								aria-live="polite"
							>
								{file ? file.name : "Choose a file or drag & drop here"}
							</p>
							<p
								id="workflow-import-help"
								className="mt-2 text-xs font-normal text-muted-foreground"
							>
								{file
									? `${file.nodes.length} nodes · ${file.connections.length} connections`
									: "One JSON file, up to 10 MB"}
							</p>
							<input
								ref={fileInputRef}
								id="workflow-import-file"
								type="file"
								accept=".json,application/json"
								className="hidden"
								disabled={busy}
								aria-label="Choose workflow JSON"
								aria-describedby="workflow-import-help"
								onChange={(event) => {
									void chooseFile(event.target.files?.[0]);
									event.target.value = "";
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={busy || reading}
								className={`mt-5 bg-background shadow-none ${neutralOutline}`}
								onClick={() => fileInputRef.current?.click()}
							>
								{reading
									? "Checking file…"
									: file
										? "Replace file"
										: "Browse file"}
							</Button>
						</section>
						{reading && (
							<output className="text-sm text-muted-foreground">
								Checking file…
							</output>
						)}
						{fileError && (
							<p role="alert" className="text-sm text-destructive">
								{fileError}
							</p>
						)}
					</div>
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
								readVersion.current++;
								setOpen(false);
							}}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="secondary"
							className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/30"
							disabled={!file || busy || reading}
						>
							{busy ? "Importing…" : "Import workflow"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
