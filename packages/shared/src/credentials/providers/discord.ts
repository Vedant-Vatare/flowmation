import type { ApiKeyCredentialDef } from "../types.js";

export const discordCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "discord",
	displayName: "Discord Bot",
	icon: "discord",
	fields: [
		{
			key: "botToken",
			label: "Bot Token",
			placeholder: "MT...",
			secret: true,
		},
	],
};
