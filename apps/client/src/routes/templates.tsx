import { createFileRoute, Outlet } from "@tanstack/react-router";

const TemplateLayout = () => <Outlet />;

export const Route = createFileRoute("/templates")({
	component: TemplateLayout,
});