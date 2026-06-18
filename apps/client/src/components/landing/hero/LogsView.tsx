import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	formatDuration,
	formatRelativeTime,
	MOCK_LOGS,
	type MockLogStatus,
} from "./logs-data";

function MockLogStatusBadge({ status }: { status: MockLogStatus }) {
	if (status === "success")
		return (
			<Badge className="bg-success text-success-foreground border-0 font-medium text-[10px] px-1.5 py-0">
				Success
			</Badge>
		);
	if (status === "failed")
		return (
			<Badge className="bg-destructive text-destructive-foreground border-0 font-medium text-[10px] px-1.5 py-0">
				Failed
			</Badge>
		);
	return (
		<Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 font-medium text-[10px] px-1.5 py-0">
			Running
		</Badge>
	);
}

export function LogsView() {
	return (
		<div className="h-full flex flex-col p-4 overflow-auto">
			<div className="mb-4">
				<h2 className="text-sm font-semibold">Execution Logs</h2>
				<p className="text-xs text-muted-foreground mt-0.5">
					All workflow runs across your account
				</p>
			</div>
			<div className="overflow-auto border rounded-md flex-1">
				<Table>
					<TableHeader className="bg-muted/50 sticky top-0 z-10">
						<TableRow>
							<TableHead className="py-2 px-3 w-20 text-xs">Status</TableHead>
							<TableHead className="py-2 px-3 text-xs">Workflow</TableHead>
							<TableHead className="py-2 px-3 w-24 text-right text-xs">
								Started
							</TableHead>
							<TableHead className="py-2 px-3 w-16 text-right text-xs">
								Duration
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MOCK_LOGS.map((log) => (
							<TableRow key={log.id}>
								<TableCell className="py-2 px-3">
									<MockLogStatusBadge status={log.status} />
								</TableCell>
								<TableCell className="py-2 px-3 text-sm font-medium">
									{log.workflowName}
								</TableCell>
								<TableCell className="py-2 px-3 text-xs text-muted-foreground text-right whitespace-nowrap">
									{formatRelativeTime(log.executedAt)}
								</TableCell>
								<TableCell className="py-2 px-3 text-xs text-muted-foreground text-right whitespace-nowrap">
									{formatDuration(log.executedAt, log.completedAt)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
