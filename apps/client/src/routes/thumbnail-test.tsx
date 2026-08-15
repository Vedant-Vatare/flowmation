import { createFileRoute } from "@tanstack/react-router";
import { ThumbnailTestPage } from "@/pages/thumbnailTest";

export const Route = createFileRoute("/thumbnail-test")({
	component: ThumbnailTestPage,
});
