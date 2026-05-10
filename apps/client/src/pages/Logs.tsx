import { Link } from "@tanstack/react-router";
import { endOfDay, format, isWithinInterval, startOfDay } from "date-fns";
import { ArrowUpRight, CalendarIcon, Filter, Loader2, X } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useExecutionLogs } from "@/queries/userWorkflows";
import { formatRelativeTime, getDurationDiff } from "@/utils/datetime";

type ExecutionStatus = "running" | "success" | "failed" | "cancelled";

type StatusFilter = {
	success: boolean;
	failed: boolean;
	running: boolean;
	cancelled: boolean;
};

const DEFAULT_STATUS_FILTER: StatusFilter = {
	success: true,
	failed: true,
	running: true,
	cancelled: true,
};

const StatusBadge = memo(({ status }: { status: ExecutionStatus }) => {
	if (status === "success")
		return (
			<Badge className="bg-success text-success-foreground border-0 font-medium text-xs px-2 py-0.5">
				Success
			</Badge>
		);
	if (status === "failed")
		return (
			<Badge className="bg-destructive text-destructive-foreground border-0 font-medium text-xs px-2 py-0.5">
				Failed
			</Badge>
		);
	if (status === "running")
		return (
			<Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 font-medium text-xs px-2 py-0.5">
				Running
			</Badge>
		);

	return (
		<Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
			Cancelled
		</Badge>
	);
});

const isAllSelected = (f: StatusFilter) =>
	f.success && f.failed && f.running && f.cancelled;

const activeStatusCount = (f: StatusFilter) =>
	[f.success, f.failed, f.running, f.cancelled].filter(Boolean).length;

export const ExecutionLogsPage = () => {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>(
		DEFAULT_STATUS_FILTER,
	);
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
		useExecutionLogs();

	const observerRef = useRef<IntersectionObserver | null>(null);
	const loadMoreRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (isLoading || isFetchingNextPage) return;
			if (observerRef.current) observerRef.current.disconnect();
			observerRef.current = new IntersectionObserver((entries) => {
				if (entries[0]?.isIntersecting && hasNextPage) fetchNextPage();
			});
			if (node) observerRef.current.observe(node);
		},
		[isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
	);

	if (isLoading) {
		return (
			<div className="flex h-full min-h-96 items-center justify-center">
				<Loader2
					className="h-5 w-5 animate-spin text-muted-foreground"
					aria-hidden="true"
				/>
				<span className="sr-only">Loading execution logs...</span>
			</div>
		);
	}

	const rawLogs = data?.pages.flatMap((page) => page.logs) ?? [];
	const uniqueLogs = Array.from(
		new Map(rawLogs.map((log) => [log.id, log])).values(),
	);

	const filteredLogs = uniqueLogs.filter((log) => {
		if (!statusFilter[log.status as keyof StatusFilter]) return false;
		if (dateRange?.from) {
			const logDate = new Date(log.executedAt);
			const from = startOfDay(dateRange.from);
			const to = dateRange.to
				? endOfDay(dateRange.to)
				: endOfDay(dateRange.from);
			if (!isWithinInterval(logDate, { start: from, end: to })) return false;
		}
		return true;
	});

	const hasActiveFilters =
		!isAllSelected(statusFilter) || dateRange?.from !== undefined;
	const statusCount = activeStatusCount(statusFilter);

	return (
		<div className="flex flex-col h-full gap-4 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-semibold">Execution Logs</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						All workflow runs across your account
					</p>
				</div>

				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setStatusFilter(DEFAULT_STATUS_FILTER);
								setDateRange(undefined);
							}}
							className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
						>
							<X className="size-3.5" />
							Clear filters
						</Button>
					)}

					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 px-3 gap-2  text-xs font-medium"
							>
								<CalendarIcon className="size-3.5 text-muted-foreground" />
								{dateRange?.from ? (
									<span className="text-foreground">
										{dateRange.to
											? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
											: format(dateRange.from, "MMM d")}
									</span>
								) : (
									<span className="text-primary-foreground font-normal">
										Date range
									</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="end">
							<Calendar
								mode="range"
								selected={dateRange}
								onSelect={setDateRange}
								numberOfMonths={1}
								disabled={{ after: new Date() }}
							/>
						</PopoverContent>
					</Popover>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 px-3 gap-2 text-xs font-medium"
							>
								<Filter className="size-3.5 text-muted-foreground" />
								<span
									className={
										statusCount < 4
											? "text-foreground font-normal"
											: "text-primary-foreground font-normal"
									}
								>
									Status
								</span>
								{statusCount < 4 && (
									<span className="rounded-full bg-primary/10 text-primary px-1.5 py-px text-[10px] font-semibold leading-none">
										{statusCount}
									</span>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							<DropdownMenuGroup>
								<DropdownMenuLabel className="text-xs">
									Filter by status
								</DropdownMenuLabel>
								<DropdownMenuCheckboxItem
									checked={statusFilter.success}
									onCheckedChange={(checked) =>
										setStatusFilter((f) => ({ ...f, success: checked }))
									}
									className="text-xs"
								>
									Success
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={statusFilter.failed}
									onCheckedChange={(checked) =>
										setStatusFilter((f) => ({ ...f, failed: checked }))
									}
									className="text-xs"
								>
									Failed
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={statusFilter.running}
									onCheckedChange={(checked) =>
										setStatusFilter((f) => ({ ...f, running: checked }))
									}
									className="text-xs"
								>
									Running
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={statusFilter.cancelled}
									onCheckedChange={(checked) =>
										setStatusFilter((f) => ({ ...f, cancelled: checked }))
									}
									className="text-xs"
								>
									Cancelled
								</DropdownMenuCheckboxItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="overflow-x-auto overflow-y-auto border rounded-md flex-1">
				{filteredLogs.length === 0 ? (
					<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
						No execution logs found.
					</div>
				) : (
					<Table>
						<TableHeader className="bg-muted/50 sticky top-0 z-10">
							<TableRow>
								<TableHead className="py-3 px-4 w-24">Status</TableHead>

								<TableHead className="py-3 px-4">Workflow</TableHead>

								<TableHead className="py-3 px-4 w-32 text-right">
									Started
								</TableHead>

								<TableHead className="py-3 px-4 w-24 text-right">
									Duration
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLogs.map((log) => (
								<TableRow key={log.id}>
									<TableCell className="py-3 px-4">
										<StatusBadge status={log.status as ExecutionStatus} />
									</TableCell>
									<TableCell className="py-3 px-4">
										<Link
											to="/workflow/$workflowId"
											params={{ workflowId: log.workflowId }}
											className="inline-flex items-center gap-1 text-sm font-medium hover:underline underline-offset-4 text-foreground"
										>
											{log.workflowName ?? "Untitled Workflow"}
											<ArrowUpRight className="h-3 w-3 text-muted-foreground shrink-0" />
										</Link>
									</TableCell>
									<TableCell className="py-3 px-4 text-xs text-muted-foreground text-right whitespace-nowrap">
										{formatRelativeTime(log.executedAt)}
									</TableCell>
									<TableCell className="py-3 px-4 text-xs text-muted-foreground text-right whitespace-nowrap">
										{getDurationDiff(log.executedAt, log.completedAt)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}

				{hasNextPage && (
					<div
						ref={loadMoreRef}
						className="h-10 w-full flex items-center justify-center py-2"
					>
						{isFetchingNextPage && (
							<>
								<Loader2
									className="h-4 w-4 animate-spin text-muted-foreground"
									aria-hidden="true"
								/>
								<span className="sr-only">Fetching more logs...</span>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
