import type { ApiKeyCredentialDef } from "../types.js";

export const mailchimpCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "mailchimp",
	displayName: "Mailchimp",
	icon: "mailchimp",
	fields: [
		{
			key: "apiKey",
			label: "API Key",
			placeholder: "abc123def456-us21",
			secret: true,
		},
		{
			key: "serverPrefix",
			label: "Server Prefix",
			placeholder: "us21",
			secret: false,
		},
	],
};
