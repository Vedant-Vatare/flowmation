import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettings } from "@/pages/settings";
export const Route = createFileRoute("/_mainLayout/settings/appearance")({
	component: AppearanceSettings,
});
