import type { DatabaseCredentialDef } from "../types.js";

export const mongodbCredential: DatabaseCredentialDef = {
	type: "database",
	name: "mongodb",
	displayName: "MongoDB",
	icon: "mongodb",
	fields: [
		{
			key: "connectionString",
			label: "Connection String",
			placeholder: "mongodb+srv://user:password@cluster.mongodb.net/dbname",
			secret: true,
		},
	],
};
