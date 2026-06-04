import { FileX } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReactFlow } from "@xyflow/react";
import { FilterIcon, Settings2Icon, XIcon } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import {
	type NodeExectionWithTime,
	useWorkflowExecutionStore,
} from "@/store/workflow/useWorkflowStore";
import { formatTime, getDurationDiff } from "@/utils/datetime";

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 256;

type StatusType = "node:completed" | "node:failed" | "node:started";

type StatusFilter = {
	completed: boolean;
	failed: boolean;
	running: boolean;
};

type DisplaySettings = {
	showTimestamp: boolean;
	showDuration: boolean;
};

const StatusBadge = memo(({ type }: { type: StatusType }) => {
	if (type === "node:completed")
		return (
			<Badge className="bg-success text-success-foreground border-0 font-medium text-xs px-2 py-0.5">
				Success
			</Badge>
		);
	if (type === "node:failed")
		return (
			<Badge className="bg-destructive text-destructive-foreground border-0 font-medium text-xs px-2 py-0.5">
				Failed
			</Badge>
		);
	if (type === "node:started")
		return (
			<Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 font-medium text-xs px-2 py-0.5">
				Running
			</Badge>
		);
	return (
		<Badge variant="secondary" className="text-xs px-2 py-0.5">
			{type}
		</Badge>
	);
});

const RunStatusBadge = memo(
	({ entries }: { entries: NodeExectionWithTime[] }) => {
		if (entries.length === 0) return null;
		const hasFailed = entries.some((e) => e.type === "node:failed");
		const hasRunning = entries.some((e) => e.type === "node:started");
		if (hasFailed)
			return (
				<Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-0 text-xs font-medium">
					Failed
				</Badge>
			);
		if (hasRunning)
			return (
				<Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-xs font-medium animate-pulse">
					Running
				</Badge>
			);
		return (
			<Badge className="bg-success text-success-foreground border-0 font-medium text-xs px-2 py-0.5">
				Completed
			</Badge>
		);
	},
);

const OutputPopover = memo(({ output }: { output: unknown }) => {
	const formatted = JSON.stringify(output, null, 2);
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="link"
					size="sm"
					className="h-auto p-0 text-xs font-medium text-primary"
				>
					View output
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				align="end"
				className="w-96 p-0 overflow-hidden"
			>
				<div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
					<span className="text-xs font-semibold text-foreground">
						Node Output
					</span>
					<Badge variant="secondary" className="text-xs">
						JSON
					</Badge>
				</div>
				<pre className="text-xs p-3 overflow-auto max-h-56 text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap break-all">
					{formatted}
				</pre>
			</PopoverContent>
		</Popover>
	);
});

const LogRow = memo(
	({
		log,
		display,
	}: {
		log: NodeExectionWithTime;
		display: DisplaySettings;
	}) => {
		const { getNodes } = useReactFlow<WorkflowCanvasNode>();

		const node = getNodes().find((n) => n.data.id === log.workflowNodeId);
		if (!node) return;

		const startedAt = log.startedAt as Date | undefined;
		const completedAt =
			log.type === "node:completed"
				? (log.completedAt as Date | undefined)
				: undefined;
		const duration = getDurationDiff(startedAt, completedAt);

		const { icon: Icon, color, background } = node.data.ui;

		return (
			<TableRow className="text-xs hover:bg-muted/30 transition-colors">
				<TableCell className="py-2.5 pl-4 pr-3 text-foreground flex items-center gap-2">
					<Icon
						className="h-6 w-6 p-1 rounded-sm shrink-0"
						style={{
							color: color ?? "currentColor",
							background: background ?? "#21212A",
						}}
					/>
					<span>{node.data.name}</span>
				</TableCell>

				<TableCell className="py-2.5 px-3">
					<StatusBadge type={log.type} />
				</TableCell>

				{display.showTimestamp && (
					<TableCell className="py-2.5 px-3 tabular-nums text-muted-foreground whitespace-nowrap">
						{formatTime(startedAt)}
					</TableCell>
				)}

				<TableCell className="w-full" />

				{display.showDuration && (
					<TableCell className="py-2.5 px-3 tabular-nums text-muted-foreground whitespace-nowrap">
						{duration ?? "-"}
					</TableCell>
				)}

				<TableCell className="py-2.5 pl-3 pr-4">
					{log.type === "node:failed" ? (
						<span
							className="text-red-500 truncate block max-w-65"
							title={log.error}
						>
							{log.error ?? "Unknown error"}
						</span>
					) : log.type === "node:completed" ? (
						log.output != null ? (
							<OutputPopover output={log.output} />
						) : (
							<span className="text-muted-foreground">—</span>
						)
					) : (
						<span className="text-muted-foreground italic">In progress…</span>
					)}
				</TableCell>
			</TableRow>
		);
	},
);

const EmptyState = memo(({ filtered }: { filtered: boolean }) => (
	<div className="flex flex-col items-center justify-center h-full gap-2.5 text-muted-foreground select-none">
		<div className="size-8 rounded-full bg-muted flex items-center justify-center">
			<HugeiconsIcon icon={FileX} size={24} />
		</div>
		<p className="text-sm text-center">
			{filtered ? (
				<span>No nodes match the current filter</span>
			) : (
				<span>No executions yet</span>
			)}
		</p>
	</div>
));

const LogsTable = memo(
	({
		logs,
		display,
	}: {
		logs: NodeExectionWithTime[];
		display: DisplaySettings;
	}) => (
		<Table className="w-full">
			<TableHeader className="sticky top-0 bg-background z-10 border-b">
				<TableRow className="hover:bg-transparent">
					<TableHead className="text-xs py-2 px-3 w-45 font-semibold text-muted-foreground">
						Node
					</TableHead>
					<TableHead className="text-xs py-2 px-3 w-25 font-semibold text-muted-foreground">
						Status
					</TableHead>
					{display.showTimestamp && (
						<TableHead className="text-xs py-2 px-3 w-27.5 font-semibold text-muted-foreground">
							Started
						</TableHead>
					)}
					<TableHead className="w-full" />
					{display.showDuration && (
						<TableHead className="text-xs py-2 px-3 w-22.5 font-semibold text-muted-foreground whitespace-nowrap">
							Duration
						</TableHead>
					)}
					<TableHead className="text-xs py-2 px-3 font-semibold text-muted-foreground whitespace-nowrap">
						Output
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{logs.map((log) => (
					<LogRow key={log.workflowNodeId} log={log} display={display} />
				))}
			</TableBody>
		</Table>
	),
);

const PanelSettings = memo(
	({
		statusFilter,
		display,
		onStatusFilterChange,
		onDisplayChange,
	}: {
		statusFilter: StatusFilter;
		display: DisplaySettings;
		onStatusFilterChange: (f: StatusFilter) => void;
		onDisplayChange: (d: DisplaySettings) => void;
	}) => (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
					>
						<FilterIcon className="size-3" />
						Filter
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-44">
					<DropdownMenuGroup>
						<DropdownMenuLabel className="text-xs">
							Filter by status
						</DropdownMenuLabel>
						<DropdownMenuCheckboxItem
							color="red"
							checked={statusFilter.completed}
							onCheckedChange={(checked) =>
								onStatusFilterChange({ ...statusFilter, completed: checked })
							}
							className="text-xs"
						>
							Success
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={statusFilter.failed}
							onCheckedChange={(checked) =>
								onStatusFilterChange({ ...statusFilter, failed: checked })
							}
							className="text-xs"
						>
							Failed
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={statusFilter.running}
							onCheckedChange={(checked) =>
								onStatusFilterChange({ ...statusFilter, running: checked })
							}
							className="text-xs"
						>
							Running
						</DropdownMenuCheckboxItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
					>
						<Settings2Icon className="size-3.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuLabel className="text-xs">
						Display options
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuCheckboxItem
						checked={display.showTimestamp}
						onCheckedChange={(checked) =>
							onDisplayChange({ ...display, showTimestamp: checked })
						}
						className="text-xs"
					>
						Show started time
					</DropdownMenuCheckboxItem>
					<DropdownMenuCheckboxItem
						checked={display.showDuration}
						onCheckedChange={(checked) =>
							onDisplayChange({ ...display, showDuration: checked })
						}
						className="text-xs"
					>
						Show duration
					</DropdownMenuCheckboxItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	),
);

const PanelHeader = memo(
	({
		allEntries,
		statusFilter,
		display,
		onStatusFilterChange,
		onDisplayChange,
		onClose,
	}: {
		allEntries: NodeExectionWithTime[];
		filteredCount: number;
		statusFilter: StatusFilter;
		display: DisplaySettings;
		onStatusFilterChange: (f: StatusFilter) => void;
		onDisplayChange: (d: DisplaySettings) => void;
		onClose: () => void;
	}) => (
		<div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0 bg-muted/20">
			<div className="flex items-center gap-2.5">
				<h3 className="font-semibold text-foreground text-sm tracking-tight">
					Execution Logs
				</h3>
				<RunStatusBadge entries={allEntries} />
			</div>

			<div className="flex items-center gap-1">
				<PanelSettings
					statusFilter={statusFilter}
					display={display}
					onStatusFilterChange={onStatusFilterChange}
					onDisplayChange={onDisplayChange}
				/>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
				>
					<XIcon className="size-3.5" />
				</Button>
			</div>
		</div>
	),
);

const DragHandle = memo(
	({
		onMouseDown,
		isDragging,
	}: {
		onMouseDown: (e: React.MouseEvent) => void;
		isDragging: boolean;
	}) => (
		<button
			type="button"
			aria-label="Resize panel"
			onMouseDown={onMouseDown}
			className="absolute top-0 left-0 right-0 h-1.5 flex items-center justify-center group/handle focus:outline-none"
			style={{ cursor: "ns-resize", zIndex: 10, marginTop: "-3px" }}
		>
			<div
				className={`w-10 h-1 rounded-full transition-all duration-150 ${
					isDragging
						? "bg-primary/75 opacity-100 w-14"
						: "bg-border opacity-0 group-hover/handle:opacity-100"
				}`}
			/>
		</button>
	),
);

export const LiveExecutionLogs = () => {
	const { open: sidebarOpen, width, isMobile } = useSidebar();
	const showLiveExecutionPanel = useWorkflowExecutionStore(
		(s) => s.showLiveExecutionPanel,
	);
	const setLiveExecutionPanel = useWorkflowExecutionStore(
		(s) => s.setLiveExecutionPanel,
	);
	const [height, setHeight] = useState(DEFAULT_HEIGHT);
	const [isDragging, setIsDragging] = useState(false);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>({
		completed: true,
		failed: true,
		running: true,
	});
	const [display, setDisplay] = useState<DisplaySettings>({
		showTimestamp: true,
		showDuration: true,
	});
	const dragStartY = useRef(0);
	const dragStartHeight = useRef(DEFAULT_HEIGHT);

	const nodeExecutionUpdates = useWorkflowExecutionStore(
		(s) => s.nodeExecutionUpdates,
	);

	const onMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			dragStartY.current = e.clientY;
			dragStartHeight.current = height;
			setIsDragging(true);
		},
		[height],
	);

	useEffect(() => {
		if (!isDragging) return;
		const onMouseMove = (e: MouseEvent) => {
			const delta = dragStartY.current - e.clientY;
			const changedHeight = Math.min(
				MAX_HEIGHT,
				Math.max(MIN_HEIGHT, dragStartHeight.current + delta),
			);
			setHeight(changedHeight);
		};
		const onMouseUp = () => setIsDragging(false);
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [isDragging]);

	const updates = Object.values(nodeExecutionUpdates).sort((a, b) => {
		if (!a.startedAt || !b.startedAt) return 0;
		return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
	});

	const entries = updates.filter((e: NodeExectionWithTime) => {
		if (e.type === "node:completed") return statusFilter.completed;
		if (e.type === "node:failed") return statusFilter.failed;
		if (e.type === "node:started") return statusFilter.running;
		return true;
	});

	const onClose = useCallback(
		() => setLiveExecutionPanel(false),
		[setLiveExecutionPanel],
	);

	if (!showLiveExecutionPanel) return null;

	return (
		<div
			className="absolute bottom-0 left-0 bg-background border-t z-50 shadow-lg flex flex-col animate-in slide-in-from-bottom-full duration-200"
			style={{
				right: sidebarOpen && !isMobile ? `${width}px` : "0px",
				height: `${height}px`,
				userSelect: isDragging ? "none" : undefined,
			}}
		>
			<DragHandle onMouseDown={onMouseDown} isDragging={isDragging} />

			<PanelHeader
				allEntries={updates}
				filteredCount={entries.length}
				statusFilter={statusFilter}
				display={display}
				onStatusFilterChange={setStatusFilter}
				onDisplayChange={setDisplay}
				onClose={onClose}
			/>

			<div className="flex-1 overflow-auto">
				{updates.length === 0 ? (
					<EmptyState filtered={false} />
				) : entries.length === 0 ? (
					<EmptyState filtered={true} />
				) : (
					<LogsTable logs={entries} display={display} />
				)}
			</div>
		</div>
	);
};
