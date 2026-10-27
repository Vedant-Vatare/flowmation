import crypto from "node:crypto";
import {
	and,
	credentialsTable,
	db,
	eq,
	exists,
	integrationTriggerStateTable,
	or,
	sql,
	userWorkflowsTable,
	workflowNodesTable,
	workflowSnapshotsTable,
} from "@nodebase/db";
import {
	CREDENTIALS_PROVIDER,
	type CredentialProvider,
	credentialRegistry,
} from "@nodebase/shared";
import { encrypt } from "@nodebase/shared/utils";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { getCookieDomain } from "@/utils/auth.utils.js";
import {
	credentialIdSchema,
	credentialUpdateSchema,
	prepareCredentialFields,
} from "@/utils/credential-management.js";

const publicCredentialColumns = {
	id: credentialsTable.id,
	name: credentialsTable.name,
	provider: credentialsTable.provider,
	type: credentialsTable.type,
	createdAt: credentialsTable.createdAt,
	updatedAt: credentialsTable.updatedAt,
};

type CredentialReference = string | typeof credentialsTable.id;

function workflowUsesCredential(credentialId: CredentialReference) {
	const matchingDraftNode = db
		.select({ id: workflowNodesTable.id })
		.from(workflowNodesTable)
		.where(
			and(
				eq(workflowNodesTable.workflowId, userWorkflowsTable.id),
				eq(workflowNodesTable.credentialId, credentialId),
			),
		);

	const matchingPublishedVersion = db
		.select({ id: workflowSnapshotsTable.id })
		.from(workflowSnapshotsTable)
		.where(
			and(
				eq(workflowSnapshotsTable.workflowId, userWorkflowsTable.id),
				sql`${workflowSnapshotsTable.nodes} @> jsonb_build_array(jsonb_build_object('credentialId', ${credentialId}::text))`,
			),
		);

	const matchingTriggerRegistration = db
		.select({ id: integrationTriggerStateTable.id })
		.from(integrationTriggerStateTable)
		.where(
			and(
				eq(integrationTriggerStateTable.workflowId, userWorkflowsTable.id),
				eq(integrationTriggerStateTable.credentialId, credentialId),
			),
		);

	return or(
		exists(matchingDraftNode),
		exists(matchingPublishedVersion),
		exists(matchingTriggerRegistration),
	);
}

export const getCredentials = async (_req: Request, res: Response) => {
	const userId = res.locals.userId;

	const credentials = await db
		.select({
			...publicCredentialColumns,
			workflowCount: db.$count(
				userWorkflowsTable,
				and(
					eq(userWorkflowsTable.userId, userId),
					workflowUsesCredential(credentialsTable.id),
				),
			),
		})
		.from(credentialsTable)
		.where(eq(credentialsTable.userId, userId));

	return res.status(200).json({ credentials });
};

export const getCredentialUsage = async (req: Request, res: Response) => {
	const id = credentialIdSchema.safeParse(req.params.id);
	if (!id.success) throw createHttpError.BadRequest("Invalid credential ID.");
	const userId = res.locals.userId as string;
	const credential = await db.query.credentialsTable.findFirst({
		where: and(
			eq(credentialsTable.id, id.data),
			eq(credentialsTable.userId, userId),
		),
		columns: { id: true },
	});
	if (!credential) throw createHttpError.NotFound("Credential not found.");
	const workflows = await db
		.select({
			id: userWorkflowsTable.id,
			name: userWorkflowsTable.name,
			status: userWorkflowsTable.status,
		})
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.userId, userId),
				workflowUsesCredential(id.data),
			),
		);
	return res.json({ workflows });
};

export const updateCredential = async (req: Request, res: Response) => {
	const id = credentialIdSchema.safeParse(req.params.id);
	const body = credentialUpdateSchema.safeParse(req.body);
	if (!id.success || !body.success)
		throw createHttpError.BadRequest(
			"Provide a valid name or credential fields.",
		);
	const userId = res.locals.userId as string;
	const credential = await db.transaction(async (tx) => {
		const [existing] = await tx
			.select()
			.from(credentialsTable)
			.where(
				and(
					eq(credentialsTable.id, id.data),
					eq(credentialsTable.userId, userId),
				),
			)
			.for("update");
		if (!existing) throw createHttpError.NotFound("Credential not found.");
		const definition = credentialRegistry[existing.provider];
		if (!definition)
			throw createHttpError.BadRequest("Unsupported credential provider.");
		const fields =
			body.data.fields === undefined
				? undefined
				: prepareCredentialFields(
						definition,
						body.data.fields,
						encrypt,
						existing.fields,
					);
		const [updated] = await tx
			.update(credentialsTable)
			.set({ name: body.data.name, fields })
			.where(
				and(
					eq(credentialsTable.id, id.data),
					eq(credentialsTable.userId, userId),
				),
			)
			.returning(publicCredentialColumns);
		return updated;
	});
	return res.json({ credential });
};

export const deleteCredential = async (req: Request, res: Response) => {
	const id = credentialIdSchema.safeParse(req.params.id);
	if (!id.success) throw createHttpError.BadRequest("Invalid credential ID.");
	const userId = res.locals.userId as string;
	await db.transaction(async (tx) => {
		const [existing] = await tx
			.select({ id: credentialsTable.id })
			.from(credentialsTable)
			.where(
				and(
					eq(credentialsTable.id, id.data),
					eq(credentialsTable.userId, userId),
				),
			)
			.for("update");
		if (!existing) throw createHttpError.NotFound("Credential not found.");
		// Check all references, including inconsistent cross-owner data, before deleting.
		const [usage] = await tx
			.select({ id: userWorkflowsTable.id })
			.from(userWorkflowsTable)
			.where(workflowUsesCredential(id.data))
			.limit(1);
		if (usage)
			throw createHttpError.Conflict(
				"This credential is used by a workflow. Replace it in drafts and published versions before deleting it.",
			);
		await tx
			.delete(credentialsTable)
			.where(
				and(
					eq(credentialsTable.id, id.data),
					eq(credentialsTable.userId, userId),
				),
			);
	});
	return res.status(204).send();
};

export const connectOAuth = async (req: Request, res: Response) => {
	const provider = req.params.provider as string;
	const userId = res.locals.userId as string;
	const isPopup = req.query.source === "popup";
	const label =
		typeof req.query.label === "string" ? req.query.label.trim() : "";
	const reconnectId = req.query.credentialId;
	if (reconnectId !== undefined) {
		if (!credentialIdSchema.safeParse(reconnectId).success)
			throw createHttpError.BadRequest("Invalid credential ID.");
		const existing = await db.query.credentialsTable.findFirst({
			where: and(
				eq(credentialsTable.id, reconnectId as string),
				eq(credentialsTable.userId, userId),
				eq(credentialsTable.provider, provider),
			),
			columns: { id: true },
		});
		if (!existing) throw createHttpError.NotFound("Credential not found.");
	}

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

	const stateObj = {
		userId,
		credentialId: reconnectId,
		nonce: crypto.randomBytes(16).toString("hex"),
	};
	const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");
	const codeVerifier = crypto.randomBytes(32).toString("base64url");
	const codeChallenge = crypto
		.createHash("sha256")
		.update(codeVerifier)
		.digest("base64url");

	const cookieOptions = {
		httpOnly: true,
		secure: true,
		sameSite: "none" as const,
		domain: getCookieDomain(),
		maxAge: 10 * 60 * 1000,
	};

	res.cookie(`oauth_${provider}_state`, state, cookieOptions);
	res.clearCookie(`oauth_${provider}_label`, {
		domain: getCookieDomain(),
		path: "/",
		sameSite: "none",
		secure: true,
	});
	res.cookie(`oauth_${provider}_verifier`, codeVerifier, cookieOptions);
	res.cookie(
		`oauth_${provider}_isPopup`,
		isPopup ? "true" : "false",
		cookieOptions,
	);
	if (label) {
		res.cookie(`oauth_${provider}_label`, label, cookieOptions);
	}

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		access_type: "offline",
		prompt: "consent",
		state: state,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
		...credentialDefinition.customAuthParams,
	});

	if (credentialDefinition.scopes.length > 0) {
		params.set(
			"scope",
			credentialDefinition.scopes.join(
				credentialDefinition.scopeSeparator ?? " ",
			),
		);
	}

	return res.redirect(`${credentialDefinition.authUrl}?${params.toString()}`);
};

export const oauthCallback = async (req: Request, res: Response) => {
	const clientUrl = process.env.CLIENT_URL;
	if (!clientUrl)
		throw createHttpError.InternalServerError("Client URL is not configured.");
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
	if (def.pkce && !codeVerifier) {
		throw createHttpError.BadRequest("Missing PKCE code verifier.");
	}

	const clearOpts = {
		domain: getCookieDomain(),
		path: "/",
		sameSite: "none" as const,
		secure: true,
	};

	res.clearCookie(`oauth_${provider}_state`, clearOpts);
	res.clearCookie(`oauth_${provider}_verifier`, clearOpts);
	res.clearCookie(`oauth_${provider}_isPopup`, clearOpts);
	res.clearCookie(`oauth_${provider}_label`, clearOpts);

	const stateStr = Buffer.from(state, "base64url").toString("utf8");
	const stateObj = JSON.parse(stateStr);
	const userId = stateObj.userId;
	const reconnectId = stateObj.credentialId as string | undefined;

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
	const tokenContentType =
		def.tokenContentType === "json"
			? "application/json"
			: "application/x-www-form-urlencoded";

	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": tokenContentType,
	};

	if (def.authMethod === "basic") {
		headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
	}

	const bodyParams: Record<string, string> = {
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
		...(def.authMethod === "body" && {
			client_id: clientId,
			client_secret: clientSecret,
		}),
		...(def.pkce && codeVerifier && { code_verifier: codeVerifier }),
	};

	const tokenResponse = await fetch(def.tokenUrl, {
		method: "POST",
		headers,
		body:
			def.tokenContentType === "json"
				? JSON.stringify(bodyParams)
				: new URLSearchParams(bodyParams),
	});

	const tokens = (await tokenResponse.json()) as {
		ok?: boolean;
		error?: string;
		expires_in?: number;
		access_token?: string;
		refresh_token?: string;
		authed_user?: {
			access_token: string;
		};
	};

	if (!tokenResponse.ok || tokens.ok === false) {
		throw createHttpError.BadRequest(
			"Authorization failed. Please try connecting the account again.",
		);
	}

	let accessToken = tokens.access_token;
	if (!accessToken && tokens.authed_user?.access_token) {
		accessToken = tokens.authed_user.access_token;
	}

	if (!accessToken) {
		throw createHttpError.BadRequest("No access token received from provider");
	}

	let expiresAt = null;
	if (tokens.expires_in) {
		expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
	}

	let accountIdentifier: string | null = null;
	if (def.getAccountIdentifier) {
		accountIdentifier = await def.getAccountIdentifier(accessToken);
	}

	const savedLabel = req.cookies[`oauth_${provider}_label`] || "";
	const credentialName = accountIdentifier
		? savedLabel
			? `${savedLabel} - ${accountIdentifier}`
			: accountIdentifier
		: `${savedLabel || def.name} Account`;

	const tokenValues = {
		accessToken: encrypt(accessToken),
		refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
		expiresAt,
	};
	let credentialId: string | undefined;
	if (reconnectId) {
		const [updated] = await db
			.update(credentialsTable)
			.set({
				...tokenValues,
				refreshToken: tokens.refresh_token
					? tokenValues.refreshToken
					: undefined,
			})
			.where(
				and(
					eq(credentialsTable.id, reconnectId),
					eq(credentialsTable.userId, userId),
					eq(credentialsTable.provider, provider),
				),
			)
			.returning({ id: credentialsTable.id });
		if (!updated)
			throw createHttpError.NotFound(
				"Credential no longer exists. Add a new connection.",
			);
		credentialId = updated.id;
	} else {
		const [created] = await db
			.insert(credentialsTable)
			.values({
				userId: userId,
				provider: provider,
				name: credentialName,
				type: "oauth",
				...tokenValues,
			})
			.returning({ id: credentialsTable.id });
		credentialId = created?.id;
	}

	if (isPopup) {
		return res.send(`
			<script>
				if (window.opener) window.opener.postMessage(${JSON.stringify({ type: "OAUTH_SUCCESS", provider, credentialId }).replace(/</g, "\\u003c")}, ${JSON.stringify(new URL(clientUrl).origin)});
				window.close();
			</script>
		`);
	}

	return res.redirect(`${clientUrl}/settings/credentials`);
};

export const saveApiKey = async (req: Request, res: Response) => {
	const provider = req.params.provider as CredentialProvider;
	const userId = res.locals.userId as string;
	const parsedName = z
		.string()
		.trim()
		.min(1)
		.max(255)
		.safeParse(req.body.name ?? `${provider} Account`);
	if (!parsedName.success)
		throw createHttpError.BadRequest(
			"Credential name must be between 1 and 255 characters.",
		);
	const name = parsedName.data;

	if (!userId) throw createHttpError.Unauthorized();

	if (!CREDENTIALS_PROVIDER.includes(provider))
		throw createHttpError.BadRequest("Unknown provider");

	const def = credentialRegistry[provider];
	if (!def || (def.type !== "apiKey" && def.type !== "database")) {
		throw createHttpError.BadRequest("Invalid credential provider type");
	}

	const { name: _name, ...inputFields } = req.body;
	const encryptedFields = prepareCredentialFields(def, inputFields, encrypt);

	const credentialType = def.type === "database" ? "database" : "apiKey";

	const [credential] = await db
		.insert(credentialsTable)
		.values({
			userId,
			provider,
			name,
			type: credentialType,
			fields: encryptedFields,
		})
		.returning({ id: credentialsTable.id });

	return res
		.status(201)
		.json({ message: "Credential saved", credentialId: credential?.id });
};
