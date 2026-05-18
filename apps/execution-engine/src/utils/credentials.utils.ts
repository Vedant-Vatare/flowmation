import { credentialsTable, db, eq } from "@nodebase/db";
import { credentialRegistry } from "@nodebase/shared";
import { decrypt, encrypt } from "@nodebase/shared/utils";

export const getDecryptedCredential = async (credentialId: string) => {
	const [credential] = await db
		.select()
		.from(credentialsTable)
		.where(eq(credentialsTable.id, credentialId));

	if (!credential) {
		throw new Error(`Credential with id ${credentialId} not found`);
	}

	if (credential.type === "apiKey") {
		const fields = credential.fields || {};
		const decryptedFields: Record<string, string> = {};
		for (const [key, value] of Object.entries(fields)) {
			decryptedFields[key] = decrypt(value);
		}
		return { type: "apiKey", fields: decryptedFields };
	}

	if (credential.type === "oauth") {
		let accessToken = credential.accessToken
			? decrypt(credential.accessToken)
			: null;

		if (!accessToken) {
			throw new Error("No access token found for this credential");
		}

		if (credential.expiresAt && new Date() >= credential.expiresAt) {
			if (!credential.refreshToken) {
				throw new Error("Token expired and no refresh token available");
			}

			const refreshToken = decrypt(credential.refreshToken);
			const provider = credential.provider;

			const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
			const clientSecret =
				process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];

			if (!clientId || !clientSecret) {
				throw new Error(`Missing OAuth client credentials for ${provider}`);
			}

			const credentialDefinition = credentialRegistry[provider];
			if (!credentialDefinition || credentialDefinition.type !== "oauth2") {
				throw new Error("Invalid OAuth provider");
			}

			const tokenResponse = await fetch(credentialDefinition.tokenUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
				},
				body: new URLSearchParams({
					client_id: clientId,
					client_secret: clientSecret,
					refresh_token: refreshToken,
					grant_type: "refresh_token",
				}),
			});

			if (!tokenResponse.ok) {
				const err = await tokenResponse.text();
				throw new Error(`Failed to fetch refresh token: ${err}`);
			}

			const tokens = (await tokenResponse.json()) as {
				expires_in: number;
				access_token: string;
				refresh_token: string;
			};
			accessToken = tokens.access_token;

			let newExpiresAt = null;
			if (tokens.expires_in) {
				newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
			}

			await db
				.update(credentialsTable)
				.set({
					accessToken: encrypt(accessToken as string),
					expiresAt: newExpiresAt,
				})
				.where(eq(credentialsTable.id, credentialId));
		}

		return { type: "oauth2", accessToken };
	}

	throw new Error(`Unknown credential type: ${credential.type}`);
};
