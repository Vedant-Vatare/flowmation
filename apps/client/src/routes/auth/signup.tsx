import { createFileRoute, redirect } from "@tanstack/react-router";
import { Signup } from "@/pages/signup";
import { isUserAuthenticated } from "@/utils/auth";

export const Route = createFileRoute("/auth/signup")({
	component: Signup,
	beforeLoad: async () => {
		const isAuthenticated = await isUserAuthenticated();
		if (isAuthenticated) return redirect({ to: "/dashboard" });
	},
});
