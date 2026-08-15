import { createFileRoute } from "@tanstack/react-router";
import { TemplateViewerPage } from "@/pages/templateViewer";

export const Route = createFileRoute("/templates/$id")({
	component: TemplateViewerPage,
});
