import type { CredentialDef } from "@nodebase/shared";
import createHttpError from "http-errors";
import { z } from "zod";

export const credentialIdSchema = z.uuid();
export const credentialUpdateSchema = z
	.object({
		name: z.string().trim().min(1).max(255).optional(),
		fields: z.record(z.string(), z.string()).optional(),
	})
	.strict()
	.refine((value) => value.name !== undefined || value.fields !== undefined);

export function prepareCredentialFields(
	definition: CredentialDef,
	input: Record<string, unknown>,
	encryptValue: (value: string) => string,
	existing?: Record<string, string> | null,
) {
	if (definition.type === "oauth2") {
		throw createHttpError.BadRequest(
			"Use reconnect to update an OAuth account.",
		);
	}
	const allowed = new Set(definition.fields.map((field) => field.key));
	if (Object.keys(input).some((key) => !allowed.has(key))) {
		throw createHttpError.BadRequest("Unknown credential field.");
	}
	const result = { ...existing };
	for (const field of definition.fields) {
		const value = input[field.key];
		if (value !== undefined && typeof value !== "string") {
			throw createHttpError.BadRequest(`Invalid value for ${field.label}.`);
		}
		if (typeof value === "string" && value.trim()) {
			result[field.key] = field.secret ? encryptValue(value) : value.trim();
		} else if (!result[field.key]) {
			throw createHttpError.BadRequest(`${field.label} is required.`);
		}
	}
	return result;
}
