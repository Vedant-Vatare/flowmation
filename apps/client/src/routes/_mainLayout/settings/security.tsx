import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettings } from "@/pages/settings";
export const Route = createFileRoute("/_mainLayout/settings/security")({
	component: SecuritySettings,
});
