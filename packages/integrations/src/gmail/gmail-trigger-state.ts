import { type db, eq, integrationTriggerStateTable } from "@nodebase/db";
import { z } from "zod";

export const GMAIL_PROVIDER = "gmail";
export const gmailStateSchema = z.object({
	labelId: z.string().min(1),
	pageToken: z.string().min(1).optional(),
	historyId: z.string().regex(/^\d+$/),
	expiresAt: z.number().int().nonnegative(),
	topic: z.string().min(1),
});
export type GmailState = z.infer<typeof gmailStateSchema>;
type TriggerTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const saveGmailState = async (
	tx: TriggerTransaction,
	id: string,
	value: GmailState,
) => {
	await tx
		.update(integrationTriggerStateTable)
		.set({
			value: gmailStateSchema.parse(value),
			updatedAt: new Date(),
		})
		.where(eq(integrationTriggerStateTable.id, id));
};
