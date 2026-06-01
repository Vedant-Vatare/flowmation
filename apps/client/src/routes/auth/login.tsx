import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login } from "@/pages/login";
import { isUserAuthenticated } from "@/utils/auth";

export const Route = createFileRoute("/auth/login")({
	component: Login,
	beforeLoad: () => {
		const isAuthenticated = isUserAuthenticated();
		if (isAuthenticated) return redirect({ to: "/dashboard" });
	},
});
