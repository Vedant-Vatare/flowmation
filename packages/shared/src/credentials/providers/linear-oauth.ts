import type { OAuth2CredentialDef } from "../types.js";

export const linearOAuthCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "linear",
	displayName: "Linear (OAuth)",
	icon: "linear",
	authUrl: "https://linear.app/oauth/authorize",
	tokenUrl: "https://api.linear.app/oauth/token",
	scopes: ["read", "write", "issues:create"],
	scopeSeparator: ",",
	authMethod: "body",
	pkce: true,
};
