export type MockLogStatus = "success" | "failed" | "running";

export const MOCK_LOGS = [
	{
		id: "1",
		workflowName: "Email Automation",
		status: "success" as MockLogStatus,
		executedAt: new Date(Date.now() - 1000 * 60 * 5),
		completedAt: new Date(Date.now() - 1000 * 60 * 5 + 2300),
	},
	{
		id: "2",
		workflowName: "Meeting Scheduler",
		status: "success" as MockLogStatus,
		executedAt: new Date(Date.now() - 1000 * 60 * 15),
		completedAt: new Date(Date.now() - 1000 * 60 * 15 + 4100),
	},
	{
		id: "3",
		workflowName: "Customer Support",
		status: "running" as MockLogStatus,
		executedAt: new Date(Date.now() - 1000 * 30),
		completedAt: null,
	},
	{
		id: "4",
		workflowName: "Email Automation",
		status: "failed" as MockLogStatus,
		executedAt: new Date(Date.now() - 1000 * 60 * 60),
		completedAt: new Date(Date.now() - 1000 * 60 * 60 + 1200),
	},
	{
		id: "5",
		workflowName: "Meeting Scheduler",
		status: "success" as MockLogStatus,
		executedAt: new Date(Date.now() - 1000 * 60 * 120),
		completedAt: new Date(Date.now() - 1000 * 60 * 120 + 3800),
	},
];

export function formatRelativeTime(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h ago`;
}

export function formatDuration(start: Date, end: Date | null): string {
	if (!end) return "...";
	const ms = end.getTime() - start.getTime();
	const seconds = Math.floor(ms / 1000);
	return `${seconds}s`;
}
