import type { ApiKeyCredentialDef } from "../types.js";

export const twilioCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "twilio",
	displayName: "Twilio",
	icon: "twilio",
	fields: [
		{
			key: "accountSid",
			label: "Account SID",
			placeholder: "AC...",
			secret: false,
		},
		{
			key: "apiKey",
			label: "Auth Token or API Key Secret",
			placeholder: "Your auth token or API key secret",
			secret: true,
		},
	],
};
