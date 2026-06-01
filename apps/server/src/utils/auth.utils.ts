import { verifyJWT } from "@nodebase/shared/utils";
import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

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
