import { createFileRoute } from "@tanstack/react-router";
import { ExecutionLogsPage } from "@/pages/Logs";

export const Route = createFileRoute("/_mainLayout/logs")({
	component: RouteComponent,
});

function RouteComponent() {
	return <ExecutionLogsPage />;
}
