import { CopyCheck, CopyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkflowNodeData } from "@/constants/nodes";
import { usePublishStatus } from "@/queries/userWorkflows";

export const DiscordTriggerAction = ({
	nodeData,
}: {
	nodeData: WorkflowNodeData;
}) => {
	const [copied, setCopied] = useState(false);
	const {
		data: publishStatus,
		isLoading,
		isError,
	} = usePublishStatus(nodeData.workflowId);
	const apiBase = (
		import.meta.env.VITE_PUBLIC_API_URL ||
		import.meta.env.VITE_API_URL ||
		""
	).replace(/\/+$/, "");
	const url = apiBase
		? `${apiBase}/triggers/${nodeData.workflowId}/${nodeData.id}`
		: "";
	const inputId = `discord-callback-${nodeData.id}`;

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timer);
	}, [copied]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			toast.error("Could not copy the URL. Select it and copy manually.");
		}
	};

	return (
		<div className="flex flex-col gap-2 px-3 py-3 border-b border-border/50">
			<Label
				htmlFor={inputId}
				className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70"
			>
				Interactions Endpoint URL
			</Label>
			<div className="flex items-center gap-2">
				<Input
					id={inputId}
					value={url}
					readOnly
					placeholder="API URL is not configured"
					className="min-w-0 font-mono text-xs bg-muted/50"
					onFocus={(event) => event.target.select()}
				/>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					disabled={!url}
					onClick={handleCopy}
					aria-label={copied ? "URL copied" : "Copy interactions endpoint URL"}
				>
					<HugeiconsIcon icon={copied ? CopyCheck : CopyIcon} size={15} />
				</Button>
			</div>
			<p className="text-xs text-muted-foreground" role="status">
				{isLoading
					? "Checking status…"
					: isError
						? "Could not check status. Try refreshing."
						: publishStatus?.isPublished
							? "Published"
							: "Publish to enable this trigger."}
			</p>
			<p className="text-xs text-muted-foreground">
				Paste this URL into your Discord application's Interactions Endpoint
				URL.
			</p>
		</div>
	);
};
