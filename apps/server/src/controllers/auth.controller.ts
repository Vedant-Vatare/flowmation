import crypto from "node:crypto";
import { db, eq, usersTable } from "@nodebase/db";
import { createJWT } from "@nodebase/shared/utils";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

const setAuthCookies = (res: Response, token: string) => {
	res.cookie("auth_token", token, {
		httpOnly: true,
		secure: true,
		maxAge: 14 * 24 * 60 * 60 * 1000,
		sameSite: "strict",
	});

	res.cookie("is_logged_in", "true", {
		httpOnly: false,
		secure: process.env.NODE_ENV === "production",
		maxAge: 14 * 24 * 60 * 60 * 1000,
		sameSite: "lax",
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
		secure: true,
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

	const decoded = jwt.decode(idToken) as any;
	if (!decoded || !decoded.sub || !decoded.email) {
		throw createHttpError.BadRequest("Invalid id_token payload");
	}

	const googleOauthId = decoded.sub;
	const email = decoded.email;
	const name = decoded.name || email.split("@")[0];

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
