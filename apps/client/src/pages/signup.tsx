import { zodResolver } from "@hookform/resolvers/zod";
import {
	startAuthentication,
	startRegistration,
} from "@simplewebauthn/browser";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import BrandIcon from "@/assets/icons/flowmation_logo_light.svg";
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
import { usePasskeyAuth } from "@/queries/auth";

const emailSchema = z.object({
	email: z.email(),
});

type EmailForm = z.infer<typeof emailSchema>;

export const Signup = () => {
	return (
		<div className="bg-muted flex items-center justify-center min-h-screen px-4">
			<SignupForm />
		</div>
	);
};

const SignupForm = () => {
	const form = useForm<EmailForm>({
		defaultValues: {
			email: "",
		},
		resolver: zodResolver(emailSchema),
	});

	const { initiate, verify } = usePasskeyAuth();

	const onGoogleSignup = () => {
		window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
	};

	const onSubmit = async (data: EmailForm) => {
		try {
			const { mode, options } = await initiate.mutateAsync(data.email);

			const attResp =
				mode === "signup"
					? await startRegistration({ optionsJSON: options })
					: await startAuthentication({ optionsJSON: options });

			const verified = await verify.mutateAsync(attResp);

			if (verified) {
				toast.success("Account created successfully!");
				router.navigate({ to: "/dashboard" });
			}
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : "Signup failed");
		}
	};

	return (
		<div className="w-full max-w-md">
			<Form {...form}>
				<form
					className="bg-card border border-border space-y-5 p-6 rounded-[10px] shadow-sm"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<div className="space-y-5 mb-2">
						<div className="flex items-center gap-2">
							<img src={BrandIcon} alt="Flowmation" className="size-8" />
							<span className="text-foreground font-medium">Flowmation</span>
						</div>
						<div className="space-y-1">
							<h1 className="font-bold text-2xl text-foreground">
								Create an account
							</h1>
							<p className="text-muted-foreground text-sm">
								Start automating your tasks today
							</p>
						</div>
					</div>

					<Button
						type="button"
						variant="outline"
						className="w-full flex items-center gap-2 h-10"
						onClick={onGoogleSignup}
					>
						<GoogleIcon width={24} height={24} fill="currentColor" />
						<span>Continue with Google</span>
					</Button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-border" />
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="bg-card px-3 text-muted-foreground">or</span>
						</div>
					</div>

					<div className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl className="relative">
										<Input
											className="bg-muted"
											placeholder="you@example.com"
											type="email"
											{...field}
											autoComplete="username webauthn"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Button
						variant="outline"
						className="w-full h-10"
						type="submit"
						disabled={initiate.isPending || verify.isPending}
					>
						{initiate.isPending
							? "Checking..."
							: verify.isPending
								? "Verifying..."
								: "Continue with Passkey"}
					</Button>

					<p className="text-center text-muted-foreground text-sm pt-1">
						Already have an account?{" "}
						<a
							className="text-primary font-medium hover:underline"
							href="/auth/login"
						>
							Sign in
						</a>
					</p>
				</form>
			</Form>
		</div>
	);
};

export default SignupForm;
