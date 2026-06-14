import crypto from "node:crypto";
import { db, eq, passkeysTable, usersTable } from "@nodebase/db";
import { createJWT } from "@nodebase/shared/utils";
import {
	type AuthenticationResponseJSON,
	type AuthenticatorTransport,
	generateAuthenticationOptions,
	generateRegistrationOptions,
	type RegistrationResponseJSON,
	type VerifiedAuthenticationResponse,
	type VerifiedRegistrationResponse,
	verifyAuthenticationResponse,
	verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

type GoogleIdTokenPayload = {
	sub: string;
	email: string;
	name?: string;
};

const getAuthConfig = () => {
	const RP_NAME = process.env.RP_NAME;
	const RP_ID = process.env.RP_ID;
	const ORIGIN = process.env.CLIENT_URL;

	if (!RP_NAME || !RP_ID || !ORIGIN) {
		console.log(
			"Missing required environment variables: RP_NAME, RP_ID, CLIENT_URL",
		);
		throw new Error("Internal server error.");
	}

	return { RP_NAME, RP_ID, ORIGIN };
};

const COOKIE_SAME_SITE = "strict" as const;

const authCookieOpts = {
	httpOnly: true,
	secure: true,
	sameSite: COOKIE_SAME_SITE,
	maxAge: 14 * 24 * 60 * 60 * 1000,
};

const challengeCookieOpts = {
	httpOnly: true,
	secure: true,
	sameSite: COOKIE_SAME_SITE,
	maxAge: 5 * 60 * 1000,
};

const CHALLENGE_COOKIES = [
	"passkey_auth_mode",
	"passkey_auth_challenge",
	"passkey_auth_email",
] as const;

const clearChallengeCookies = (res: Response) => {
	for (const name of CHALLENGE_COOKIES) res.clearCookie(name);
};

const buildExcludeCredentials = (
	passkeys: { credentialId: string; transports: unknown }[],
) =>
	passkeys.map((passkey) => ({
		id: passkey.credentialId,
		transports: (passkey.transports as AuthenticatorTransport[]) || [
			"internal",
		],
	}));

const generatePasskeyName = (userAgent: string | undefined): string => {
	if (!userAgent) return "Passkey";

	const ua = userAgent.toLowerCase();

	const browser = ua.includes("edg/")
		? "Edge"
		: ua.includes("opr/") || ua.includes("opera")
			? "Opera"
			: ua.includes("chrome") && !ua.includes("edg/")
				? "Chrome"
				: ua.includes("firefox")
					? "Firefox"
					: ua.includes("safari") && !ua.includes("chrome")
						? "Safari"
						: "Browser";

	let os = "Device";
	if (ua.includes("iphone")) os = "iPhone";
	else if (ua.includes("ipad")) os = "iPad";
	else if (ua.includes("android")) os = "Android";
	else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
	else if (ua.includes("windows")) os = "Windows";
	else if (ua.includes("linux")) os = "Linux";

	return `${browser} on ${os}`;
};

const setAuthCookies = (res: Response, token: string) => {
	res.cookie("auth_token", token, authCookieOpts);
	res.cookie("is_authenticated", "true", {
		...authCookieOpts,
		httpOnly: false,
	});
};

export const googleLogin = async (_req: Request, res: Response) => {
	const clientId = process.env.GOOGLE_CLIENT_ID;

	if (!clientId) {
		throw createHttpError.InternalServerError("Missing GOOGLE_CLIENT_ID");
	}

	const redirectUri = `${process.env.API_SERVER_URL}/api/v1/auth/google/callback`;
	const stateObj = { nonce: crypto.randomBytes(16).toString("hex") };
	const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");

	res.cookie("oauth_google_login_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 10 * 60 * 1000,
	});

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: "openid email profile",
		prompt: "select_account",
		state: state,
	});

	return res.redirect(
		`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
	);
};

export const logout = async (_req: Request, res: Response) => {
	res.clearCookie("auth_token");
	res.clearCookie("is_authenticated");
	clearChallengeCookies(res);
	res.clearCookie("passkey_reg_challenge");
	return res.status(200).json({ message: "Logged out successfully" });
};

export const googleCallback = async (req: Request, res: Response) => {
	const { code, state } = req.query;
	const savedState = req.cookies.oauth_google_login_state;

	if (
		!code ||
		typeof code !== "string" ||
		!state ||
		typeof state !== "string"
	) {
		throw createHttpError.BadRequest("Missing code or state");
	}

	if (!savedState || state !== savedState) {
		throw createHttpError.BadRequest("Invalid OAuth state");
	}

	res.clearCookie("oauth_google_login_state");

	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = `${process.env.API_SERVER_URL}/api/v1/auth/google/callback`;

	if (!clientId || !clientSecret) {
		throw createHttpError.InternalServerError("Missing Google credentials");
	}

	const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			grant_type: "authorization_code",
			redirect_uri: redirectUri,
		}),
	});

	const tokens = (await tokenResponse.json()) as {
		access_token?: string;
		refresh_token?: string;
		id_token?: string;
		expires_in?: number;
		scope?: string;
		token_type?: string;
		error?: string;
		error_description?: string;
	};

	if (!tokenResponse.ok) {
		throw createHttpError.BadRequest(
			`Failed to exchange code: ${tokens.error_description || tokens.error}`,
		);
	}

	const idToken = tokens.id_token;
	if (!idToken) {
		throw createHttpError.BadRequest("No id_token received from Google");
	}

	const payload = jwt.decode(idToken) as GoogleIdTokenPayload;
	if (
		!payload ||
		typeof payload === "string" ||
		!payload.sub ||
		!payload.email
	) {
		throw createHttpError.BadRequest("Invalid id_token payload");
	}

	const googleOauthId = String(payload.sub);
	const email = String(payload.email);
	const name = String(payload.name ?? email.split("@")[0]);

	let [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.googleOauthId, googleOauthId))
		.limit(1);

	if (!user) {
		[user] = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.limit(1);

		if (user) {
			[user] = await db
				.update(usersTable)
				.set({ googleOauthId })
				.where(eq(usersTable.id, user.id))
				.returning();
		} else {
			[user] = await db
				.insert(usersTable)
				.values({
					email,
					name,
					googleOauthId,
				})
				.returning();
		}
	}

	if (!user) {
		throw createHttpError.InternalServerError("Failed to authenticate user");
	}

	const token = await createJWT({ userId: user.id });

	setAuthCookies(res, token);

	return res.redirect(
		`${process.env.CLIENT_URL || "http://localhost:5173/dashboard"}`,
	);
};

export const passkeyInitiate = async (req: Request, res: Response) => {
	const { email } = req.body;
	if (!email) throw createHttpError.BadRequest("Email is required");

	const { RP_NAME, RP_ID } = getAuthConfig();

	const [existingUser] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.limit(1);

	const userPasskeys = existingUser
		? await db
				.select()
				.from(passkeysTable)
				.where(eq(passkeysTable.userId, existingUser.id))
		: [];

	const needsRegistration = !existingUser || userPasskeys.length === 0;

	if (needsRegistration) {
		const options = await generateRegistrationOptions({
			rpName: RP_NAME,
			rpID: RP_ID,
			userID: Buffer.from(existingUser?.id ?? email, "utf-8"),
			userName: email,
			userDisplayName: existingUser?.name || email,
			attestationType: "none",
			excludeCredentials: buildExcludeCredentials(userPasskeys),
			authenticatorSelection: {
				residentKey: "preferred",
				userVerification: "preferred",
				authenticatorAttachment: "platform",
			},
		});

		res.cookie("passkey_auth_mode", "signup", challengeCookieOpts);
		res.cookie(
			"passkey_auth_challenge",
			options.challenge,
			challengeCookieOpts,
		);
		res.cookie("passkey_auth_email", email, challengeCookieOpts);

		return res.status(200).json({ mode: "signup", options });
	}

	const options = await generateAuthenticationOptions({
		rpID: RP_ID,
		allowCredentials: buildExcludeCredentials(userPasskeys),
		userVerification: "preferred",
	});

	res.cookie("passkey_auth_mode", "login", challengeCookieOpts);
	res.cookie("passkey_auth_challenge", options.challenge, challengeCookieOpts);
	res.cookie("passkey_auth_email", email, challengeCookieOpts);

	return res.status(200).json({ mode: "login", options });
};

export const passkeyVerify = async (req: Request, res: Response) => {
	const body = req.body;
	const expectedChallenge = req.cookies.passkey_auth_challenge;
	const email = req.cookies.passkey_auth_email;
	const mode = req.cookies.passkey_auth_mode;

	if (!expectedChallenge || !email || !mode) {
		throw createHttpError.BadRequest("could not verify the passkey");
	}

	try {
		if (mode === "signup") {
			return await handlePasskeySignup(
				req,
				res,
				body as RegistrationResponseJSON,
				expectedChallenge,
				email,
			);
		}
		return await handlePasskeyLogin(
			res,
			body as AuthenticationResponseJSON,
			expectedChallenge,
			email,
		);
	} catch (error) {
		clearChallengeCookies(res);
		throw error;
	}
};

const handlePasskeySignup = async (
	req: Request,
	res: Response,
	body: RegistrationResponseJSON,
	expectedChallenge: string,
	email: string,
) => {
	const { RP_ID, ORIGIN } = getAuthConfig();
	let verification: VerifiedRegistrationResponse;
	try {
		verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge,
			expectedOrigin: ORIGIN,
			expectedRPID: RP_ID,
			requireUserVerification: false,
		});
	} catch (error) {
		console.error("verifyRegistrationResponse error", error);
		throw createHttpError.BadRequest((error as Error).message);
	}

	const { verified, registrationInfo } = verification;
	if (!verified || !registrationInfo) {
		throw createHttpError.BadRequest("Passkey registration failed");
	}

	const [existingUser] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.limit(1);

	let user = existingUser;
	if (!user) {
		const name = email.split("@")[0] || "User";
		[user] = await db
			.insert(usersTable)
			.values({ email: email as string, name })
			.returning();
		if (!user) {
			throw createHttpError.InternalServerError("Failed to create user");
		}
	}

	const { credential } = registrationInfo;
	const publicKey = Buffer.from(new Uint8Array(credential.publicKey)).toString(
		"base64url",
	);

	const passkeyName = generatePasskeyName(req.headers["user-agent"]);

	await db.insert(passkeysTable).values({
		userId: user.id,
		name: passkeyName,
		credentialId: credential.id,
		publicKey,
		counter: credential.counter,
		transports: credential.transports,
	});

	clearChallengeCookies(res);

	const token = await createJWT({ userId: user.id });
	setAuthCookies(res, token);

	return res.status(200).json({ verified });
};

const handlePasskeyLogin = async (
	res: Response,
	body: AuthenticationResponseJSON,
	expectedChallenge: string,
	email: string,
) => {
	const { RP_ID, ORIGIN } = getAuthConfig();
	const [existingUser] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.limit(1);

	if (!existingUser) {
		throw createHttpError.NotFound("User not found");
	}

	const userPasskey = await db
		.select()
		.from(passkeysTable)
		.where(eq(passkeysTable.credentialId, body.id))
		.limit(1);

	const passkey = userPasskey[0];
	if (!passkey || passkey.userId !== existingUser.id) {
		throw createHttpError.BadRequest("Invalid passkey credential");
	}

	let verification: VerifiedAuthenticationResponse;
	try {
		verification = await verifyAuthenticationResponse({
			response: body,
			expectedChallenge,
			expectedOrigin: ORIGIN,
			expectedRPID: RP_ID,
			credential: {
				id: passkey.credentialId,
				publicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64url")),
				counter: passkey.counter,
				transports: passkey.transports as AuthenticatorTransport[],
			},
			requireUserVerification: false,
		});
	} catch (error) {
		console.error("verifyAuthenticationResponse error", error);
		throw createHttpError.BadRequest((error as Error).message);
	}

	const { verified, authenticationInfo } = verification;
	if (!verified) {
		throw createHttpError.BadRequest("Passkey verification failed");
	}

	await db
		.update(passkeysTable)
		.set({
			counter: authenticationInfo.newCounter,
			lastUsedAt: new Date(),
		})
		.where(eq(passkeysTable.id, passkey.id));

	clearChallengeCookies(res);

	const token = await createJWT({ userId: existingUser.id });
	setAuthCookies(res, token);

	return res.status(200).json({ verified });
};

export const generatePasskeyRegistration = async (
	_req: Request,
	res: Response,
) => {
	const { RP_NAME, RP_ID } = getAuthConfig();
	const userId = res.locals.userId;
	if (!userId) throw createHttpError.Unauthorized("User not logged in");

	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, userId))
		.limit(1);

	if (!user) throw createHttpError.NotFound("User not found");

	const userPasskeys = await db
		.select()
		.from(passkeysTable)
		.where(eq(passkeysTable.userId, user.id));

	const options = await generateRegistrationOptions({
		rpName: RP_NAME,
		rpID: RP_ID,
		userID: Buffer.from(user.id, "utf-8"),
		userName: user.email,
		userDisplayName: user.name || user.email,
		attestationType: "none",
		excludeCredentials: buildExcludeCredentials(userPasskeys),
		authenticatorSelection: {
			residentKey: "preferred",
			userVerification: "preferred",
			authenticatorAttachment: "platform",
		},
	});

	res.cookie("passkey_reg_challenge", options.challenge, challengeCookieOpts);

	return res.status(200).json(options);
};

export const verifyPasskeyRegistration = async (
	req: Request,
	res: Response,
) => {
	const { RP_ID, ORIGIN } = getAuthConfig();
	const userId = res.locals.userId;
	if (!userId) throw createHttpError.Unauthorized("User not logged in");

	const body = req.body;
	const expectedChallenge = req.cookies.passkey_reg_challenge;

	if (!expectedChallenge) {
		throw createHttpError.BadRequest("Challenge expired or not found");
	}

	let verification: VerifiedRegistrationResponse;
	try {
		verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge,
			expectedOrigin: ORIGIN,
			expectedRPID: RP_ID,
			requireUserVerification: false,
		});
	} catch (error) {
		console.error("verifyRegistrationResponse error", error);
		res.clearCookie("passkey_reg_challenge");
		throw createHttpError.BadRequest((error as Error).message);
	}

	const { verified, registrationInfo } = verification;
	if (!verified || !registrationInfo) {
		res.clearCookie("passkey_reg_challenge");
		throw createHttpError.BadRequest("Passkey registration failed");
	}

	const { credential } = registrationInfo;
	const publicKeyBase64 = Buffer.from(
		new Uint8Array(credential.publicKey),
	).toString("base64url");

	const passkeyName = generatePasskeyName(req.headers["user-agent"]);

	await db.insert(passkeysTable).values({
		userId,
		name: passkeyName,
		credentialId: credential.id,
		publicKey: publicKeyBase64,
		counter: credential.counter,
		transports: credential.transports,
	});

	res.clearCookie("passkey_reg_challenge");

	return res.status(200).json({ verified });
};
