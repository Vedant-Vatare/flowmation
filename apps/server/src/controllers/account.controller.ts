import { and, db, eq, passkeysTable, usersTable } from "@nodebase/db";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";

export const getAccount = async (_req: Request, res: Response) => {
	const [user] = await db
		.select({
			name: usersTable.name,
			email: usersTable.email,
			googleConnected: usersTable.googleOauthId,
		})
		.from(usersTable)
		.where(eq(usersTable.id, res.locals.userId));
	if (!user) throw createHttpError.NotFound("Account not found");
	const passkeys = await db
		.select({
			id: passkeysTable.id,
			name: passkeysTable.name,
			createdAt: passkeysTable.createdAt,
			lastUsedAt: passkeysTable.lastUsedAt,
		})
		.from(passkeysTable)
		.where(eq(passkeysTable.userId, res.locals.userId));
	return res.json({
		name: user.name,
		email: user.email,
		googleConnected: !!user.googleConnected,
		passkeys,
	});
};

export const updateAccount = async (req: Request, res: Response) => {
	const parsed = z
		.object({ name: z.string().trim().min(1).max(255) })
		.safeParse(req.body);
	if (!parsed.success)
		throw createHttpError.BadRequest(
			"Enter a name between 1 and 255 characters",
		);
	const [user] = await db
		.update(usersTable)
		.set(parsed.data)
		.where(eq(usersTable.id, res.locals.userId))
		.returning({
			id: usersTable.id,
			name: usersTable.name,
			email: usersTable.email,
		});
	if (!user) throw createHttpError.NotFound("Account not found");
	return res.json({ user });
};

export const deletePasskey = async (req: Request, res: Response) => {
	if (!z.uuid().safeParse(req.params.id).success)
		throw createHttpError.BadRequest("Invalid passkey");
	await db.transaction(async (tx) => {
		const [user] = await tx
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, res.locals.userId))
			.for("update");
		if (!user) throw createHttpError.NotFound("Account not found");
		const passkeys = await tx
			.select({ id: passkeysTable.id })
			.from(passkeysTable)
			.where(eq(passkeysTable.userId, user.id));
		if (!passkeys.some((passkey) => passkey.id === req.params.id))
			throw createHttpError.NotFound("Passkey not found");
		if (!user.googleOauthId && passkeys.length <= 1)
			throw createHttpError.Conflict(
				"Add another passkey before removing your only sign-in method",
			);
		await tx
			.delete(passkeysTable)
			.where(
				and(
					eq(passkeysTable.id, req.params.id as string),
					eq(passkeysTable.userId, user.id),
				),
			);
	});
	return res.json({ message: "Passkey removed" });
};
