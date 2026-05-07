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

const formatRelativeTime = (date: Date | string) => {
	if (!date) return "-";
	const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
	const diff = (new Date(date).getTime() - Date.now()) / 1000;

	if (Math.abs(diff) < 60) return "just now";
	if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), "minute");
	if (Math.abs(diff) < 86400)
		return rtf.format(Math.round(diff / 3600), "hour");
	return rtf.format(Math.round(diff / 86400), "day");
};

const getStatusColor = (status: string) => {
	switch (status) {
		case "success":
			return "bg-[#1b4332] text-[#52b788] border-transparent rounded-md";
		case "failed":
			return "bg-[#5c1320] text-[#dd2d4a] border-transparent rounded-md";
		case "running":
			return "bg-blue-950 text-blue-400 border-transparent rounded-md";
		default:
			return "bg-secondary text-secondary-foreground border-transparent rounded-md";
	}
};

export const WorkflowLogs = () => {
	const { workflowId } = Route.useParams();
	const [statusFilter, setStatusFilter] = useState<string>("all");
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
			<div className="flex h-full min-h-[200px] items-center justify-center p-4">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const logs = data?.pages.flatMap((page) => page.logs) || [];
	const filteredLogs = logs.filter(
		(log) => statusFilter === "all" || log.status === statusFilter,
	);

	return (
		<div className="flex flex-col h-full overflow-hidden gap-3 py-2">
			<div className="flex justify-between items-center px-1">
				<span className="text-sm font-medium">Execution History</span>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[120px] h-8 text-xs">
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

			<div className="overflow-y-auto max-h-[calc(100vh-14rem)] border rounded-md">
				{filteredLogs.length === 0 ? (
					<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
						No execution logs found.
					</div>
				) : (
					<Table>
						<TableHeader className="bg-muted/50 sticky top-0 z-10">
							<TableRow>
								<TableHead className="w-[90px]">Status</TableHead>
								<TableHead>Time</TableHead>
								<TableHead className="text-right">Result</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLogs.map((log) => (
								<TableRow key={log.id}>
									<TableCell>
										<Badge
											variant="outline"
											className={`capitalize ${getStatusColor(log.status)}`}
										>
											{log.status}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground text-xs whitespace-nowrap">
										{formatRelativeTime(log.executedAt)}
									</TableCell>
									<TableCell
										className="text-right font-mono text-xs truncate max-w-[150px]"
										title={log.result || ""}
									>
										{log.result || "-"}
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
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						)}
					</div>
				)}
			</div>
		</div>
	);
};
