import type { OAuth2CredentialDef } from "../types.js";

export const clickupCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "clickup",
	displayName: "ClickUp",
	icon: "clickup",
	authUrl: "https://app.clickup.com/api",
	tokenUrl: "https://api.clickup.com/api/v2/oauth/token",
	scopes: ["*"],
	scopeSeparator: " ",
	authMethod: "body",
	pkce: true,
	redirectUri: "http://localhost:3000",
};
