import type { OAuth2CredentialDef } from "../types.js";

export const githubCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "github",
	displayName: "GitHub",
	icon: "github",
	authUrl: "https://github.com/login/oauth/authorize",
	tokenUrl: "https://github.com/login/oauth/access_token",
	scopes: ["repo", "user"],
	scopeSeparator: " ",
};
