import type { OAuth2CredentialDef } from "../types.js";

export const slackCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "slack",
	displayName: "Slack",
	icon: "slack",
	authUrl: "https://slack.com/oauth/v2/authorize",
	tokenUrl: "https://slack.com/api/oauth.v2.access",
	scopes: ["chat:write", "channels:read", "groups:read", "users:read", "channels:manage"],
	scopeSeparator: " ",
	authMethod: "body",
};
