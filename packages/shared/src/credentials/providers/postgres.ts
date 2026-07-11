import type { DatabaseCredentialDef } from "../types.js";

export const postgresCredential: DatabaseCredentialDef = {
	type: "database",
	name: "postgres",
	displayName: "PostgreSQL",
	icon: "postgres",
	fields: [
		{
			key: "connectionString",
			label: "Connection String",
			placeholder: "postgresql://user:password@localhost:5432/dbname",
			secret: true,
		},
	],
};
