import { Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useWorkflowLogs } from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import { formatRelativeTime } from "@/utils/datetime";

type StatusFilter = "all" | "success" | "failed" | "running";

const getStatusColor = (status: string) => {
	switch (status) {
		case "success":
			return "bg-[#166534] text-[#a7f3d0] border-transparent rounded-md";
		case "failed":
			return "bg-destructive/15 text-destructive border-transparent rounded-md";
		case "running":
			return "bg-primary/15 text-primary border-transparent rounded-md";
		default:
			return "bg-muted text-muted-foreground border-transparent rounded-md";
	}
};

export const WorkflowLogs = () => {
	const { workflowId } = Route.useParams();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
		useWorkflowLogs(workflowId);

	const observerRef = useRef<IntersectionObserver | null>(null);
	const loadMoreRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (isLoading || isFetchingNextPage) return;
			if (observerRef.current) observerRef.current.disconnect();

			observerRef.current = new IntersectionObserver((entries) => {
				if (entries[0]?.isIntersecting && hasNextPage) {
					fetchNextPage();
				}
			});

			if (node) observerRef.current.observe(node);
		},
		[isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
	);

	if (isLoading) {
		return (
			<div className="flex h-full min-h-50 items-center justify-center p-4">
				<Loader2
					className="h-6 w-6 animate-spin text-muted-foreground"
					aria-hidden="true"
				/>
				<span className="sr-only">Loading execution logs...</span>
			</div>
		);
	}

	const rawLogs = data?.pages.flatMap((page) => page.logs) || [];

	const uniqueLogs = Array.from(
		new Map(rawLogs.map((log) => [log.id, log])).values(),
	);

	const filteredLogs = uniqueLogs.filter(
		(log) => statusFilter === "all" || log.status === statusFilter,
	);

	return (
		<div className="flex flex-col h-full overflow-hidden gap-3 ">
			<div className="flex justify-end items-center px-1">
				<Select
					value={statusFilter}
					onValueChange={(v: StatusFilter) => setStatusFilter(v)}
				>
					<SelectTrigger className="w-30 h-8 text-xs">
						<SelectValue placeholder="Filter Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="success">Success</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
						<SelectItem value="running">Running</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-14rem)] border rounded-md">
				{filteredLogs.length === 0 ? (
					<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
						No execution logs found.
					</div>
				) : (
					<Table>
						<TableHeader className="bg-muted/50 sticky top-0 z-10">
							<TableRow>
								<TableHead className="w-27.5 py-3 px-4">Status</TableHead>
								<TableHead className="py-3 px-4 text-right">Time</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLogs.map((log) => (
								<TableRow key={log.id}>
									<TableCell className="py-3 px-4">
										<Badge
											variant="outline"
											className={`capitalize ${getStatusColor(log.status)}`}
										>
											{log.status}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground text-xs whitespace-nowrap py-3 px-4 text-right">
										{formatRelativeTime(log.executedAt)}
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
