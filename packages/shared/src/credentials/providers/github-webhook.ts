import type { ApiKeyCredentialDef } from "../types.js";

export const githubWebhookCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "github_webhook",
	displayName: "GitHub Webhook",
	icon: "github",
	fields: [
		{
			key: "webhookSecret",
			label: "Webhook Secret",
			placeholder: "Same random secret as your GitHub repository webhook",
			secret: true,
		},
	],
};
