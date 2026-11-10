import type { NodeExecutionStatus, WorkflowNodeOutput } from "@nodebase/shared";
import { useEdges, useNodes } from "@xyflow/react";
import { Check, ChevronRight, Copy, RefreshCw } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useLatestWorkflowNodeOutputs } from "@/queries/userWorkflows";

const statusLabels: Record<NodeExecutionStatus, string> = {
	running: "Running",
	success: "Completed",
	failed: "Failed",
	skipped: "Skipped",
	waiting: "Needs review",
};

const SavedOutput = ({
	name,
	result,
	isRunning,
}: {
	name: string;
	result?: WorkflowNodeOutput;
	isRunning: boolean;
}) => {
	const [copied, setCopied] = useState(false);
	useEffect(() => {
		if (!copied) return;
		const timeout = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timeout);
	}, [copied]);

	if (!result) {
		return (
			<p className="py-3 text-xs leading-relaxed text-muted-foreground">
				{isRunning
					? `${name} has not run yet.`
					: "Run the workflow to view this node’s output."}
			</p>
		);
	}

	const formatted = JSON.stringify(result.output, null, 2) ?? "null";
	const copyOutput = async () => {
		try {
			await navigator.clipboard.writeText(formatted);
			setCopied(true);
		} catch {
			toast.error(
				"Could not copy output. Select the JSON to copy it manually.",
			);
		}
	};

	return (
		<div className="min-w-0">
			<div className="flex items-center justify-between gap-2 py-2">
				<div className="min-w-0">
					<span
						className={
							result.status === "failed"
								? "text-xs text-destructive"
								: "text-xs text-muted-foreground"
						}
					>
						{statusLabels[result.status]}
					</span>
				</div>
				{(result.status === "success" || result.status === "failed") && (
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onClick={copyOutput}
						aria-label={`Copy ${name} output`}
					>
						{copied ? (
							<Check aria-hidden="true" />
						) : (
							<Copy aria-hidden="true" />
						)}
						{copied ? "Copied" : "Copy JSON"}
					</Button>
				)}
			</div>
			<p className="pb-3 text-[11px] text-muted-foreground">
				Started{" "}
				<time dateTime={result.executedAt}>
					{new Date(result.executedAt).toLocaleString()}
				</time>
			</p>
			{result.status === "waiting" ? (
				<p className="pb-3 text-xs text-muted-foreground">
					Open Pending reviews in Runs to make a decision.
				</p>
			) : result.status === "running" ? (
				<p className="pb-3 text-xs text-muted-foreground">
					Waiting for this node to finish…
				</p>
			) : result.status === "skipped" ? (
				<p className="pb-3 text-xs text-muted-foreground">
					This node was skipped.
				</p>
			) : (
				<>
					<section
						// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll saved JSON.
						tabIndex={0}
						aria-label={`${name} output`}
						className="max-h-[60vh] min-h-32 overflow-auto rounded-sm bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<pre>
							<code>{formatted.slice(0, 20_000)}</code>
						</pre>
					</section>
					{formatted.length > 20_000 && (
						<p className="mt-2 text-[11px] text-muted-foreground">
							Preview shortened. Copy JSON includes the full output.
						</p>
					)}
				</>
			)}
		</div>
	);
};

const NodeOutput = ({
	node,
	result,
	isRunning,
	defaultOpen = false,
}: {
	node: WorkflowCanvasNode;
	result?: WorkflowNodeOutput;
	isRunning: boolean;
	defaultOpen?: boolean;
}) => {
	const {
		icon: Icon,
		color,
		background,
		iconBackground,
		branded,
	} = node.data.ui;
	return (
		<Collapsible
			defaultOpen={defaultOpen}
			className="group/node-output min-w-0"
		>
			<CollapsibleTrigger
				type="button"
				aria-label={`${node.data.name} output`}
				className="flex w-full min-w-0 items-center gap-2 rounded-sm py-3 text-left text-xs font-medium hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<span
					className="flex size-6 shrink-0 items-center justify-center rounded-sm"
					style={{ background: iconBackground ?? background }}
				>
					<Icon
						aria-hidden="true"
						className="size-4"
						style={branded ? undefined : { color }}
					/>
				</span>
				<span className="min-w-0 flex-1 break-words">{node.data.name}</span>
				<ChevronRight
					aria-hidden="true"
					className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/node-output:rotate-90 motion-reduce:transition-none"
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="pb-3">
				<SavedOutput
					key={result?.id ?? node.id}
					name={node.data.name}
					result={result}
					isRunning={isRunning}
				/>
			</CollapsibleContent>
		</Collapsible>
	);
};

export const NodeExecutionData = memo(
	({ node, active = true }: { node: WorkflowCanvasNode; active?: boolean }) => {
		const nodes = useNodes<WorkflowCanvasNode>();
		const edges = useEdges();
		const { data, isPending, isFetching, isError, refetch } =
			useLatestWorkflowNodeOutputs(node.data.workflowId, active);
		const previousIds = new Set(
			edges
				.filter((edge) => edge.target === node.id)
				.map((edge) => edge.source),
		);
		const previousNodes = nodes.filter(
			(candidate) => candidate.id !== node.id && previousIds.has(candidate.id),
		);
		const outputs = new Map(
			data?.nodeOutputs.map((output) => [output.workflowNodeId, output]),
		);
		const execution = data?.execution;
		const isRunning =
			execution?.status === "running" || execution?.status === "waiting";

		return (
			<section aria-label="Execution data" className="min-w-0 px-3 py-4">
				<div className="flex items-center justify-between gap-2">
					<h3 className="text-xs font-medium">This node</h3>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onClick={() => void refetch()}
						disabled={isFetching}
						aria-label="Refresh execution data"
					>
						<RefreshCw
							className={
								isFetching ? "animate-spin motion-reduce:animate-none" : ""
							}
							aria-hidden="true"
						/>
						Refresh
					</Button>
				</div>
				{isPending ? (
					<output className="block space-y-2 py-3">
						<span className="sr-only">Loading execution data</span>
						<span className="block h-3 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
						<span className="block h-16 animate-pulse rounded bg-muted motion-reduce:animate-none" />
					</output>
				) : (
					<>
						{isError && (
							<p role="alert" className="mt-2 text-xs text-destructive">
								{data
									? "Could not refresh. Showing the last loaded results."
									: "Could not load execution data. Select Refresh to try again."}
							</p>
						)}
						{execution ? (
							<>
								<NodeOutput
									node={node}
									result={outputs.get(node.id)}
									isRunning={isRunning}
									defaultOpen
								/>
								{previousNodes.length > 0 && (
									<section
										aria-label="Incoming nodes"
										className="mt-4 border-t pt-4"
									>
										<h3 className="mb-1 text-xs font-medium">Incoming nodes</h3>
										<div className="divide-y divide-border/50">
											{previousNodes.map((previous) => (
												<NodeOutput
													key={previous.id}
													node={previous}
													result={outputs.get(previous.id)}
													isRunning={isRunning}
												/>
											))}
										</div>
									</section>
								)}
							</>
						) : (
							!isError && (
								<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
									Run the workflow to view node outputs.
								</p>
							)
						)}
					</>
				)}
			</section>
		);
	},
);
