import type { ApiKeyCredentialDef } from "../types.js";

export const airtableCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "airtable",
	displayName: "Airtable",
	icon: "airtable",
	fields: [
		{
			key: "apiKey",
			label: "Personal Access Token",
			placeholder: "pat...",
			secret: true,
		},
	],
};
