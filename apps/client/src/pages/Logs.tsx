import { useExecutionLogs } from "@/queries/userWorkflows";

export const ExecutionLogsPage = () => {
	const { data, isLoading } = useExecutionLogs();

	if (isLoading) return <span>Loading logs</span>;
	return null;
};
