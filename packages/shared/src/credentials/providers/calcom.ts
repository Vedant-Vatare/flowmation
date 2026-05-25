import type { ApiKeyCredentialDef } from "../types.js";

export const calcomCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "calcom",
	displayName: "Cal.com",
	icon: "calcom",
	fields: [
		{
			key: "apiKey",
			label: "API Key",
			placeholder: "cal_live_...",
			secret: true,
		},
	],
};
