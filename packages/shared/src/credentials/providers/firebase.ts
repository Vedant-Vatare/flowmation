import type { ApiKeyCredentialDef } from "../types.js";

export const firebaseCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "firebase",
	displayName: "Firebase",
	icon: "firebase",
	fields: [
		{
			key: "apiKey",
			label: "Project ID",
			placeholder: "your-project-id",
			secret: false,
		},
		{
			key: "token",
			label: "Auth Token",
			placeholder: "firebase auth token",
			secret: true,
		},
	],
};
