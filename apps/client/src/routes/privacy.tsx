import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicy } from "@/pages/privacy";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPolicy,
});
