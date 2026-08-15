import { createFileRoute } from "@tanstack/react-router";
import { TemplatesIndexPage } from "@/pages/templatesIndex";

export const Route = createFileRoute("/templates/")({
	component: TemplatesIndexPage,
});