import { adminstable, db, eq } from "@nodebase/db";
import { verifyJWT } from "@nodebase/shared/utils";
import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

export const getCookieDomain = (): string | undefined => {
	const clientUrl = process.env.CLIENT_URL;
	if (!clientUrl) return undefined;
	try {
		const { hostname } = new URL(clientUrl);
		if (hostname === "localhost") return undefined;
		return `.${hostname}`;
	} catch {
		return undefined;
	}
};

export const authenticateUser = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = req.cookies?.auth_token;
	if (!token)
		throw createHttpError.Unauthorized("No authentication token provided");

	try {
		const userCredentials = await verifyJWT(token);
		res.locals.userId = userCredentials.userId;
		next();
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message === "Token expired") {
				throw createHttpError.Unauthorized("Token expired");
			}
			if (error.message === "Invalid JWT Token") {
				throw createHttpError.Unauthorized("Invalid JWT Token");
			}
		}
		throw createHttpError.Unauthorized("Authentication failed");
	}
};

export const authenticateAdminUser = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = req.cookies?.auth_token;
	if (!token)
		throw createHttpError.Unauthorized("No authentication token provided");
	try {
		const { userId } = await verifyJWT(token);

		const [isAdmin] = await db
			.select()
			.from(adminstable)
			.where(eq(adminstable.userId, userId));

		if (!isAdmin) throw createHttpError.Unauthorized("Authentication failed");

		res.locals.userId = userId;

		next();
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message === "Token expired") {
				throw createHttpError.Unauthorized("Token expired");
			}
			if (error.message === "Invalid JWT Token") {
				throw createHttpError.Unauthorized("Invalid JWT Token");
			}
		}
		throw createHttpError.Unauthorized("Authentication failed");
	}
};
