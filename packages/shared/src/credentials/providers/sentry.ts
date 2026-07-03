import type { ApiKeyCredentialDef } from "../types.js";

export const sentryCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "sentry",
	displayName: "Sentry",
	icon: "sentry",
	fields: [
		{
			key: "apiKey",
			label: "Auth Token",
			placeholder: "sntrys_...",
			secret: true,
		},
	],
};
