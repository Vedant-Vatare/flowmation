import { credentialRegistry } from "@nodebase/shared";
import { KeyRound } from "lucide-react";
import GoogleIcon from "@/assets/icons/nodes/google.svg?react";
import { NODE_UI_REGISTRY } from "@/constants/nodes";

export const providerName = (provider: string) =>
	provider === "google"
		? "Google"
		: (credentialRegistry[provider]?.displayName ?? provider);
export const authenticationName = (type: string) =>
	({
		oauth: "OAuth 2.0",
		oauth2: "OAuth 2.0",
		apiKey: "API key",
		database: "Database",
	})[type] ?? type;
export const providers = Object.entries(credentialRegistry).sort(([a], [b]) =>
	providerName(a).localeCompare(providerName(b)),
);

export function ProviderIcon({ provider }: { provider: string }) {
	const task = provider === "github_webhook" ? "github" : provider;
	const Icon =
		provider === "google"
			? GoogleIcon
			: (NODE_UI_REGISTRY[`action.${task}`]?.icon ?? KeyRound);
	return (
		<span className="credential-provider-icon" aria-hidden="true">
			<Icon className="size-5" />
		</span>
	);
}

export function credentialDate(value?: string | Date) {
	if (!value || Number.isNaN(new Date(value).getTime())) return "Not available";
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(value));
}
