import type { OAuth2CredentialDef } from "../types.js";

export const notionCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "notion",
	displayName: "notion",
	icon: "notion",
	authUrl: "https://api.notion.com/v1/oauth/authorize",
	tokenUrl: "https://api.notion.com/v1/oauth/token",
	scopes: [],
	authMethod: "basic",
	pkce: false,
	tokenContentType: "json",
};
