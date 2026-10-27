import { createFileRoute } from "@tanstack/react-router";
import { CredentialsPage } from "@/pages/credentials";

export const Route = createFileRoute("/_mainLayout/settings/credentials")({
	component: CredentialsPage,
});
