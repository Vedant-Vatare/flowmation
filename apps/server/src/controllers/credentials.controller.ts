import crypto from "node:crypto";
import { credentialsTable, db, eq } from "@nodebase/db";
import {
	CREDENTIALS_PROVIDER,
	type CredentialProvider,
	credentialRegistry,
} from "@nodebase/shared";
import { encrypt } from "@nodebase/shared/utils";
import type { Request, Response } from "express";
import createHttpError from "http-errors";

export const getCredentials = async (_req: Request, res: Response) => {
	const userId = res.locals.userId;

	const credentials = await db
		.select({
			id: credentialsTable.id,
			name: credentialsTable.name,
			provider: credentialsTable.provider,
			type: credentialsTable.type,
			createdAt: credentialsTable.createdAt,
		})
		.from(credentialsTable)
		.where(eq(credentialsTable.userId, userId));

	return res.status(200).json({ credentials });
};

export const connectOAuth = async (req: Request, res: Response) => {
	const provider = req.params.provider as string;
	const userId = res.locals.userId as string;
	const isPopup = req.query.source === "popup";

	const credentialDefinition = credentialRegistry[provider];

	if (!credentialDefinition || credentialDefinition.type !== "oauth2") {
		throw createHttpError.BadRequest("Invalid OAuth provider");
	}

	const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
	if (!clientId) {
		throw createHttpError.InternalServerError(
			`Missing client ID for ${provider}`,
		);
	}

	const redirectUri = `${process.env.API_SERVER_URL}/api/v1/credentials/oauth/${provider}/callback`;

	const stateObj = { userId, nonce: crypto.randomBytes(16).toString("hex") };
	const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");
	const codeVerifier = crypto.randomBytes(32).toString("base64url");
	const codeChallenge = crypto
		.createHash("sha256")
		.update(codeVerifier)
		.digest("base64url");

	const cookieOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 10 * 60 * 1000,
	};
	console.log({ redirectUri });

	res.cookie(`oauth_${provider}_state`, state, cookieOptions);
	res.cookie(`oauth_${provider}_verifier`, codeVerifier, cookieOptions);
	res.cookie(
		`oauth_${provider}_isPopup`,
		isPopup ? "true" : "false",
		cookieOptions,
	);

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: credentialDefinition.scopes.join(
			credentialDefinition.scopeSeparator ?? " ",
		),
		access_type: "offline",
		prompt: "consent",
		state: state,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
	});

	return res.redirect(`${credentialDefinition.authUrl}?${params.toString()}`);
};

export const oauthCallback = async (req: Request, res: Response) => {
	const provider = req.params.provider as CredentialProvider;
	const { code, state } = req.query;
	const def = credentialRegistry[provider];

	if (!def || def.type !== "oauth2") {
		throw createHttpError.BadRequest("Invalid OAuth provider");
	}

	if (
		!code ||
		typeof code !== "string" ||
		!state ||
		typeof state !== "string"
	) {
		throw createHttpError.BadRequest("Missing code or state");
	}

	const savedState = req.cookies[`oauth_${provider}_state`];
	const codeVerifier = req.cookies[`oauth_${provider}_verifier`];
	const isPopup = req.cookies[`oauth_${provider}_isPopup`] === "true";

	if (!savedState || state !== savedState) {
		throw createHttpError.BadRequest("Invalid OAuth state.");
	}
	if (!codeVerifier) {
		throw createHttpError.BadRequest("Missing PKCE code verifier.");
	}

	res.clearCookie(`oauth_${provider}_state`);
	res.clearCookie(`oauth_${provider}_verifier`);
	res.clearCookie(`oauth_${provider}_isPopup`);

	const stateStr = Buffer.from(state, "base64url").toString("utf8");
	const stateObj = JSON.parse(stateStr);
	const userId = stateObj.userId;

	if (!userId) throw createHttpError.Unauthorized();

	if (!CREDENTIALS_PROVIDER.includes(provider))
		throw createHttpError.BadRequest("Unknown provider");

	const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
	const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
	const redirectUri = `${process.env.API_SERVER_URL}/api/v1/credentials/oauth/${provider}/callback`;

	if (!clientId || !clientSecret) {
		throw createHttpError.InternalServerError(
			`Missing credentials for ${provider}`,
		);
	}

	const tokenResponse = await fetch(def.tokenUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		},
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
			code_verifier: codeVerifier,
		}),
	});

	if (!tokenResponse.ok) {
		const err = await tokenResponse.text();
		throw createHttpError.BadRequest(`Failed to exchange code: ${err}`);
	}

	const tokens = (await tokenResponse.json()) as {
		expires_in: number;
		access_token: string;
		refresh_token: string;
	};

	let expiresAt = null;
	if (tokens.expires_in) {
		expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
	}

	let accountIdentifier: string | null = null;
	if (def.getAccountIdentifier) {
		accountIdentifier = await def.getAccountIdentifier(tokens.access_token);
	}

	const credentialName = accountIdentifier
		? `${accountIdentifier}`
		: `${def.name} Account`;

	await db.insert(credentialsTable).values({
		userId: userId,
		provider: provider,
		name: credentialName,
		type: "oauth",
		accessToken: encrypt(tokens.access_token),
		refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
		expiresAt,
	});

	if (isPopup) {
		return res.send(`
			<script>
				window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${provider}' }, '*');
				window.close();
			</script>
		`);
	}

	return res.redirect(
		`${process.env.CLIENT_URL}/settings/credentials?connected=${provider}`,
	);
};

export const saveApiKey = async (req: Request, res: Response) => {
	const provider = req.params.provider as CredentialProvider;
	const userId = res.locals.userId as string;
	const name = req.body.name || `${provider} Account`;

	if (!userId) throw createHttpError.Unauthorized();

	if (!CREDENTIALS_PROVIDER.includes(provider))
		throw createHttpError.BadRequest("Unknown provider");

	const def = credentialRegistry[provider];
	if (!def || def.type !== "apiKey") {
		throw createHttpError.BadRequest("Invalid API Key provider");
	}

	const encryptedFields: Record<string, string> = {};
	for (const field of def.fields) {
		const value = req.body[field.key];
		if (!value && field.secret) {
			throw createHttpError.BadRequest(`Missing required field: ${field.key}`);
		}
		if (value) {
			encryptedFields[field.key] = field.secret ? encrypt(value) : value;
		}
	}

	const [credential] = await db
		.insert(credentialsTable)
		.values({
			userId,
			provider,
			name,
			type: "apiKey",
			fields: encryptedFields,
		})
		.returning({ id: credentialsTable.id });

	return res
		.status(201)
		.json({ message: "Credential saved", credentialId: credential?.id });
};
