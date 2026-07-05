import type { ApiKeyCredentialDef } from "../types.js";

export const asanaCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "asana",
	displayName: "Asana",
	icon: "asana",
	fields: [
		{
			key: "apiKey",
			label: "Personal Access Token",
			placeholder: "1/12345678:abcdef...",
			secret: true,
		},
	],
};
