import { createFileRoute } from "@tanstack/react-router";
import { TemplateDetailsPage } from "@/pages/templateDetails";

export const Route = createFileRoute("/templates/$templateId")({
	component: TemplateDetailsPage,
});
