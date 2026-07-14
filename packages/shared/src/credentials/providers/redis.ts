import type { DatabaseCredentialDef } from "../types.js";

export const redisCredential: DatabaseCredentialDef = {
	type: "database",
	name: "redis",
	displayName: "Redis",
	icon: "redis",
	fields: [
		{
			key: "connectionString",
			label: "Connection String",
			placeholder: "redis://user:password@localhost:6379",
			secret: true,
		},
	],
};
