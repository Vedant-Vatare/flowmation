import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login } from "@/pages/login";
import { isUserAuthenticated } from "@/utils/auth";

export const Route = createFileRoute("/auth/login")({
	component: Login,
	beforeLoad: async () => {
		const isAuthenticated = await isUserAuthenticated();
		if (isAuthenticated) return redirect({ to: "/dashboard" });
	},
});
