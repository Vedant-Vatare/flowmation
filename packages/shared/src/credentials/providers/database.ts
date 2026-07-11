import type { ApiKeyCredentialDef } from "../types.js";

export const postgresCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "postgres",
	displayName: "PostgreSQL",
	icon: "postgres",
	fields: [
		{
			key: "connectionString",
			label: "Connection String",
			placeholder: "postgresql://username:password@host:5432/db",
			secret: true,
		},
	],
};
