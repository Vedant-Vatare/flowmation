import type { OAuth2CredentialDef } from "../types.js";

export const jiraOAuthCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "jira",
	displayName: "Jira (OAuth)",
	icon: "jira",
	authUrl: "https://auth.atlassian.com/authorize",
	tokenUrl: "https://auth.atlassian.com/oauth/token",
	scopes: ["read:jira-work", "write:jira-work", "read:jira-user"],
	scopeSeparator: " ",
	authMethod: "body",
	pkce: true,
};
