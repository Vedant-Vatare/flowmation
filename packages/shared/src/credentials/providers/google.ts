import type { OAuth2CredentialDef } from "../types.js";

export const googleCredential: OAuth2CredentialDef = {
	type: "oauth2",
	name: "google",
	displayName: "Google OAuth",
	icon: "google",
	authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
	tokenUrl: "https://oauth2.googleapis.com/token",
	scopes: [
		"https://www.googleapis.com/auth/gmail.send",
		"https://www.googleapis.com/auth/gmail.readonly",
		"https://www.googleapis.com/auth/gmail.compose",
		"https://www.googleapis.com/auth/gmail.modify",
		"https://www.googleapis.com/auth/userinfo.email",
	],
	getAccountIdentifier: async (accessToken: string) => {
		try {
			const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			if (!res.ok) return null;
			const data = (await res.json()) as { email?: string };
			return data.email || null;
		} catch {
			return null;
		}
	},
};
