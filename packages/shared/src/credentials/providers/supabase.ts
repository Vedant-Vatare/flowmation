import type { ApiKeyCredentialDef } from "../types.js";

export const supabaseCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "supabase",
	displayName: "Supabase",
	icon: "supabase",
	fields: [
		{
			key: "projectRef",
			label: "Project Reference",
			placeholder: "your-project-ref",
			secret: false,
		},
		{
			key: "apiKey",
			label: "API Key (anon or service_role)",
			placeholder: "API Key",
			secret: true,
		},
	],
};
