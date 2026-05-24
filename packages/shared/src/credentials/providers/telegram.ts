import type { ApiKeyCredentialDef } from "../types.js";

export const telegramCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "telegram",
	displayName: "Telegram",
	icon: "telegram",
	fields: [
		{
			key: "apiKey",
			label: "Bot Token",
			placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
			secret: true,
		},
	],
};
