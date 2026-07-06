import type { ApiKeyCredentialDef } from "../types.js";

export const trelloCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "trello",
	displayName: "Trello",
	icon: "trello",
	fields: [
		{
			key: "apiKey",
			label: "API Key",
			placeholder: "0123456789abcdef0123456789abcdef",
			secret: true,
		},
		{
			key: "token",
			label: "API Token",
			placeholder: "ATTA...",
			secret: true,
		},
	],
};
