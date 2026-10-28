import {
	and,
	credentialsTable,
	db,
	eq,
	getDecryptedCredential,
} from "@nodebase/db";
import createHttpError from "http-errors";

export const getGoogleCalendarAccessToken = async (
	credentialId: string | null,
	userId: string,
) => {
	const credential = credentialId
		? await db.query.credentialsTable.findFirst({
				where: and(
					eq(credentialsTable.id, credentialId),
					eq(credentialsTable.userId, userId),
				),
			})
		: undefined;
	if (
		!credential ||
		credential.provider !== "google" ||
		credential.type !== "oauth"
	) {
		throw createHttpError.BadRequest(
			"Select a Google credential belonging to this workflow's owner",
		);
	}
	const decrypted = await getDecryptedCredential(credential.id, userId);
	if (decrypted.type !== "oauth2" || !decrypted.accessToken) {
		throw new Error(
			"Reconnect the Google credential for this Calendar trigger",
		);
	}
	return decrypted.accessToken;
};
