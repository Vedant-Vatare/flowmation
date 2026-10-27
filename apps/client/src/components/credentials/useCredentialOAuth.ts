import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function useCredentialOAuth(onSuccess?: () => void) {
	const queryClient = useQueryClient();
	const popup = useRef<Window | null>(null);
	const attempt = useRef<{
		provider: string;
		origin: string;
		credentialId?: string;
	} | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	const successCallback = useRef(onSuccess);
	successCallback.current = onSuccess;

	useEffect(() => {
		const receive = (event: MessageEvent) => {
			const current = attempt.current;
			if (
				!current ||
				event.origin !== current.origin ||
				event.source !== popup.current ||
				event.data?.type !== "OAUTH_SUCCESS" ||
				event.data.provider !== current.provider ||
				(current.credentialId &&
					event.data.credentialId !== current.credentialId)
			)
				return;
			attempt.current = null;
			setPending(false);
			setError("");
			void queryClient.invalidateQueries({ queryKey: ["credentials"] });
			toast.success(
				current.credentialId ? "Account reconnected" : "Account added",
			);
			successCallback.current?.();
		};
		window.addEventListener("message", receive);
		return () => {
			window.removeEventListener("message", receive);
			popup.current?.close();
		};
	}, [queryClient]);

	useEffect(() => {
		if (!pending) return;
		const started = Date.now();
		const interval = window.setInterval(() => {
			if (!attempt.current) return;
			if (popup.current?.closed || Date.now() - started > 180_000) {
				attempt.current = null;
				setPending(false);
				setError(
					"Authorization was not completed. Try again when you are ready.",
				);
			}
		}, 750);
		return () => window.clearInterval(interval);
	}, [pending]);

	const cancel = useCallback(() => {
		attempt.current = null;
		popup.current?.close();
		setPending(false);
		setError("");
	}, []);

	const connect = (provider: string, name: string, credentialId?: string) => {
		setError("");
		try {
			const base = import.meta.env.VITE_API_URL;
			if (!base) throw new Error("API URL unavailable");
			const url = new URL(
				`${base.replace(/\/$/, "")}/credentials/oauth/${provider}/connect`,
				window.location.origin,
			);
			url.searchParams.set("source", "popup");
			url.searchParams.set("label", name);
			if (credentialId) url.searchParams.set("credentialId", credentialId);
			popup.current = window.open(
				url.toString(),
				"flowmation_credentials_oauth",
				`width=600,height=720,left=${Math.max(0, window.screenX + (window.outerWidth - 600) / 2)},top=${Math.max(0, window.screenY + (window.outerHeight - 720) / 2)}`,
			);
			if (!popup.current) {
				setError(
					"Your browser blocked the sign-in window. Allow popups for Flowmation and try again.",
				);
				return;
			}
			attempt.current = { provider, origin: url.origin, credentialId };
			setPending(true);
		} catch {
			setError(
				"Could not open authorization. Check your connection and try again.",
			);
		}
	};
	return { connect, cancel, pending, error };
}
