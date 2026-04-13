import { verifyJWT } from "@nodebase/shared";
import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

export const authenticateUser = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) throw createHttpError.Unauthorized();

	const userCredentials = await verifyJWT(token);
	res.locals.userId = userCredentials.userId;
	next();
};

export const bcryptHash = async (data: string) => {
	return bcrypt.hash(data, 12);
};

export const bcryptCompareHash = async (password: string, hash: string) => {
	return bcrypt.compare(password, hash);
};
