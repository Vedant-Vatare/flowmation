import { db, eq, usersTable } from "@nodebase/db";
import { createJWT, type userLogin, type userSignup } from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { isDBQueryError } from "@/utils/api.utils.js";
import { bcryptCompareHash, bcryptHash } from "@/utils/auth.utils.js";

export const Signup = async (req: Request, res: Response) => {
	try {
		const { password, name, email } = req.body as userSignup;
		const hashedPassword = await bcryptHash(password);

		const [user] = await db
			.insert(usersTable)
			.values({ name, email, password: hashedPassword })
			.returning({
				id: usersTable.id,
				name: usersTable.name,
				email: usersTable.email,
				created_at: usersTable.createdAt,
			});

		if (!user) {
			throw createHttpError(400, "Failed to create user");
		}
		const token = await createJWT({ userId: user.id });
		return res
			.status(201)
			.json({ message: "user signup success", user, token });
	} catch (e) {
		const queryError = isDBQueryError(e);

		if (queryError?.code === "23505") {
			throw createHttpError.Conflict("email already exists");
		}
		throw e;
	}
};

export const Login = async (req: Request, res: Response) => {
	const { email, password } = req.body as userLogin;
	const [user] = await db
		.select({ id: usersTable.id, password: usersTable.password })
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.limit(1);

	if (!user) {
		throw createHttpError.NotFound("User with email not found");
	}
	if (!user.password) throw createHttpError.BadRequest("invalid login method");

	const isPasswordCorrect = await bcryptCompareHash(password, user.password);

	if (!isPasswordCorrect)
		throw createHttpError.Unauthorized("invalid password");

	const token = await createJWT({ userId: user.id });
	return res.status(200).json({ mesage: "user login successful", token });
};
