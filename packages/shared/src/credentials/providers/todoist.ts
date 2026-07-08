import type { OAuth2CredentialDef } from "../types.js";

export const todoistCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "todoist",
	displayName: "Todoist",
	icon: "todoist",
	authUrl: "https://app.todoist.com/oauth/authorize",
	tokenUrl: "https://api.todoist.com/oauth/access_token",
	scopes: ["data:read_write", "data:delete"],
	scopeSeparator: ",",
	authMethod: "body",
	pkce: true,
	getAccountIdentifier: async (accessToken: string) => {
		try {
			const res = await fetch(
				"https://api.todoist.com/api/v1/sync",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						sync_token: "*",
						resource_types: '["user"]',
					}).toString(),
				},
			);
			if (!res.ok) return null;
			const data = (await res.json()) as {
				user?: { email?: string };
			};
			return data.user?.email || null;
		} catch {
			return null;
		}
	},
};
