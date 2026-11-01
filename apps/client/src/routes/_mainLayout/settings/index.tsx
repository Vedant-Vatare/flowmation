import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@/pages/settings";
export const Route = createFileRoute("/_mainLayout/settings/")({
	component: AccountSettings,
});
