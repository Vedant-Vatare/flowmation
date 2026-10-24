import { z } from "zod";

export class GmailApiError extends Error {
	constructor(public status: number) {
		super(`Gmail API request failed (HTTP ${status})`);
	}
}
const requestGmail = async (token: string, path: string, body?: unknown) => {
	const response = await fetch(
		`https://gmail.googleapis.com/gmail/v1/users/me/${path}`,
		{
			method: body === undefined ? "GET" : "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
			signal: AbortSignal.timeout(15000),
		},
	);
	if (!response.ok) {
		throw new GmailApiError(response.status);
	}
	if (response.status === 204) {
		return {};
	}
	return response.json().catch(() => {
		throw new Error("Gmail returned an invalid JSON response");
	});
};

const pendingReads = new Map<string, Promise<unknown>>();
export const gmailRequest = async (
	token: string,
	path: string,
	body?: unknown,
) => {
	if (body !== undefined) {
		return requestGmail(token, path, body);
	}
	const key = JSON.stringify([token, path]);
	const pending = pendingReads.get(key);
	if (pending) {
		return pending;
	}
	// Share concurrent reads using the same Google token; retain no email cache.
	const request = requestGmail(token, path);
	pendingReads.set(key, request);
	try {
		return await request;
	} finally {
		pendingReads.delete(key);
	}
};

export const gmailProfileSchema = z.object({
	emailAddress: z.email(),
	historyId: z.string().regex(/^\d+$/),
});

export const gmailWatchSchema = z.object({
	historyId: z.string().regex(/^\d+$/),
	expiration: z.string().regex(/^\d+$/),
});

const messageRef = z.object({
	id: z.string().min(1),
	labelIds: z.array(z.string()).optional(),
});

export const gmailHistorySchema = z.object({
	historyId: z.string().regex(/^\d+$/),
	nextPageToken: z.string().optional(),
	history: z
		.array(
			z.object({
				id: z.string().regex(/^\d+$/),
				messagesAdded: z.array(z.object({ message: messageRef })).optional(),
			}),
		)
		.default([]),
});

const gmailMessagePartSchema = z.looseObject({
	mimeType: z.string().optional(),
	filename: z.string().optional(),
	headers: z
		.array(z.object({ name: z.string(), value: z.string() }))
		.optional(),
	body: z
		.looseObject({
			data: z.string().optional(),
			size: z.number().int().nonnegative().optional(),
			attachmentId: z.string().optional(),
		})
		.optional(),
	get parts(): z.ZodOptional<z.ZodArray<typeof gmailMessagePartSchema>> {
		return z.array(gmailMessagePartSchema).optional();
	},
});

type Part = z.infer<typeof gmailMessagePartSchema>;

export const gmailMessageSchema = z.looseObject({
	id: z.string().min(1),
	threadId: z.string().min(1),
	labelIds: z.array(z.string()).optional(),
	snippet: z.string().optional(),
	internalDate: z.string().regex(/^\d+$/),
	historyId: z.string().regex(/^\d+$/).optional(),
	payload: gmailMessagePartSchema.optional(),
});

export type GmailMessage = z.infer<typeof gmailMessageSchema>;

export const getGmailMessageOutput = async (
	message: GmailMessage,
	token: string,
) => {
	const text: string[] = [];
	const html: string[] = [];
	const attachments: {
		filename: string;
		mimeType: string;
		size: number;
		attachmentId?: string;
	}[] = [];

	const visit = async (part: Part, depth = 0): Promise<void> => {
		if (depth > 64) {
			throw new Error("Gmail message nesting exceeds 64 levels");
		}
		if (
			part.filename ||
			(part.body?.attachmentId && !part.mimeType?.startsWith("text/"))
		) {
			attachments.push({
				filename: part.filename || "",
				mimeType: part.mimeType || "application/octet-stream",
				size: part.body?.size || 0,
				...(part.body?.attachmentId
					? { attachmentId: part.body.attachmentId }
					: {}),
			});
			return;
		}

		if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
			let data = part.body?.data;
			if (!data && part.body?.attachmentId) {
				const body = z
					.object({ data: z.string() })
					.parse(
						await gmailRequest(
							token,
							`messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(part.body.attachmentId)}`,
						),
					);
				data = body.data;
			}
			if (data) {
				const contentType =
					part.headers?.find((h) => {
						return h.name.toLowerCase() === "content-type";
					})?.value || "";
				const charset =
					/charset\s*=\s*["']?([^\s;"']+)/i.exec(contentType)?.[1] || "utf-8";
				let decoder: TextDecoder;
				try {
					decoder = new TextDecoder(charset);
				} catch {
					decoder = new TextDecoder();
				}
				const content = decoder.decode(Buffer.from(data, "base64url"));
				(part.mimeType === "text/plain" ? text : html).push(content);
			}
		}

		for (const child of part.parts || []) {
			await visit(child, depth + 1);
		}
	};

	if (message.payload) {
		await visit(message.payload);
	}

	const headers = message.payload?.headers || [];

	const header = (name: string) => {
		return headers
			.filter((h) => {
				return h.name.toLowerCase() === name;
			})
			.map((h) => {
				return h.value;
			})
			.join(", ");
	};

	return {
		id: message.id,
		threadId: message.threadId,
		labelIds: message.labelIds || [],
		snippet: message.snippet || "",
		from: header("from"),
		to: header("to"),
		cc: header("cc"),
		subject: header("subject"),
		date: header("date"),
		messageId: header("message-id"),
		internalDate: message.internalDate,
		text: text.join("\n"),
		html: html.join("\n"),
		attachments,
		headers,
	};
};

export const isMatchingGmailMessage = (
	message: GmailMessage,
	labelId: string,
	eventLabels?: string[],
) => {
	return (
		(eventLabels || message.labelIds || []).includes(labelId) &&
		!message.labelIds?.includes("DRAFT")
	);
};
