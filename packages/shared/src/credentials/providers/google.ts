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
	],
};
