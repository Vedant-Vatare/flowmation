import type { ApiKeyCredentialDef } from "../types.js";

export const aiCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "ai",
	displayName: "AI Provider",
	icon: "ai",
	fields: [
		{
			key: "apiKey",
			label: "API Key",
			placeholder: "sk-...",
			secret: true,
		},
	],
};
