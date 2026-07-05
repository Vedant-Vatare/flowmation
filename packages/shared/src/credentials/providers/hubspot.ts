import type { OAuth2CredentialDef } from "../types.js";

export const hubspotCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "hubspot",
	displayName: "HubSpot",
	icon: "hubspot",
	authUrl: "https://app.hubspot.com/oauth/authorize",
	tokenUrl: "https://api.hubapi.com/oauth/v1/token",
	scopes: [
		"crm.objects.contacts.read",
		"crm.objects.contacts.write",
		"crm.objects.deals.read",
		"crm.objects.deals.write",
	],
	scopeSeparator: " ",
	authMethod: "body",
	pkce: true,
};
