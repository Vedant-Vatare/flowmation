import { createFileRoute, redirect } from "@tanstack/react-router";
import { LandingPage } from "@/pages/landing";
import { isUserAuthenticated } from "@/utils/auth";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		const isAuthenticated = isUserAuthenticated();
		if (isAuthenticated) throw redirect({ to: "/dashboard" });
	},
	component: LandingPage,
});
