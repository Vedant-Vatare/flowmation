import { zodResolver } from "@hookform/resolvers/zod";
import {
	startAuthentication,
	startRegistration,
} from "@simplewebauthn/browser";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import GoogleIcon from "@/assets/icons/nodes/google.svg?react";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { router } from "@/main";

const emailSchema = z.object({
	email: z.email(),
});

type EmailForm = z.infer<typeof emailSchema>;

export const Login = () => {
	return (
		<div className="bg-muted flex items-center justify-center min-h-screen w-screen px-4">
			<LoginForm />
		</div>
	);
};

const LoginForm = () => {
	const form = useForm<EmailForm>({
		defaultValues: {
			email: "",
		},
		resolver: zodResolver(emailSchema),
	});

	const onGoogleLogin = () => {
		window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
	};

	const onSubmit = async (data: EmailForm) => {
		try {
			const res = await fetch(
				`${import.meta.env.VITE_API_URL}/auth/passkey/initiate`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: data.email }),
					credentials: "include",
				},
			);

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.message || "Failed to initiate passkey login");
			}

			const { mode, ...options } = await res.json();

			const asseResp =
				mode === "signup"
					? await startRegistration({ optionsJSON: options })
					: await startAuthentication({ optionsJSON: options });

			const verificationRes = await fetch(
				`${import.meta.env.VITE_API_URL}/auth/passkey/verify`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(asseResp),
					credentials: "include",
				},
			);

			if (!verificationRes.ok) {
				throw new Error("Passkey verification failed");
			}

			toast.success("Logged in successfully!");
			router.navigate({ to: "/dashboard" });
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Passkey login failed",
			);
		}
	};

	return (
		<div className="w-full max-w-md">
			<Form {...form}>
				<form
					className="bg-card border border-border space-y-5 p-6 rounded-2xl shadow-sm"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<div className="space-y-1 mb-2">
						<h1 className="font-bold text-2xl text-foreground">Welcome back</h1>
						<p className="text-muted-foreground text-sm">
							Sign in to your account to continue
						</p>
					</div>

					<Button
						type="button"
						variant="outline"
						className="w-full flex items-center gap-2 h-10 hover:bg-muted"
						onClick={onGoogleLogin}
					>
						<GoogleIcon width={24} height={24} fill="currentColor" />
						<span>Continue with Google</span>
					</Button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-border" />
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="bg-card px-3 text-muted-foreground">Or</span>
						</div>
					</div>

					<div className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											className="bg-muted"
											placeholder="you@example.com"
											type="email"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Button className="w-full h-10" type="submit">
						Sign in with Passkey
					</Button>

					<p className="text-center text-muted-foreground text-sm pt-1">
						Don't have an account?{" "}
						<a
							className="text-primary font-medium hover:underline"
							href="/auth/signup"
						>
							Sign up
						</a>
					</p>
				</form>
			</Form>
		</div>
	);
};

export default LoginForm;
