import type { GmailNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const createEmailMessage = (
	to: string,
	subject: string,
	bodyText: string,
	inReplyTo?: string,
	references?: string,
) => {
	const headers = [
		`To: ${to}`,
		`Subject: ${subject}`,
		"Content-Type: text/html; charset=utf-8",
	];
	if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
	if (references) headers.push(`References: ${references}`);

	return [...headers, "", bodyText].join("\r\n");
};

export const gmailNodeExecutor = async (
	node: GmailNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Gmail node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return { success: false, message: "Invalid credential format for Gmail" };
		}

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation)
			throw new Error("gmail node operation is invalid");

		if (operation === "send_email" || operation === "create_draft") {
			const to = params.to?.value as string;
			const subject = params.subject?.value as string;
			const bodyText = params.body?.value as string;

			const message = createEmailMessage(to, subject, bodyText);
			const encodedMessage = Buffer.from(message).toString("base64url");

			const endpoint =
				operation === "send_email"
					? "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
					: "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

			const body =
				operation === "send_email"
					? { raw: encodedMessage }
					: { message: { raw: encodedMessage } };

			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${credential.accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			return handleResponse(response, "Gmail API request failed");
		}

		if (operation === "send_draft") {
			const draftId = params.draftId?.value as string;
			const response = await fetch(
				"https://gmail.googleapis.com/gmail/v1/users/me/drafts/send",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${credential.accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id: draftId }),
				},
			);
			return handleResponse(response, "Gmail API request failed");
		}

		if (operation === "search_emails") {
			const query = params.query?.value as string | undefined;
			const maxResults = params.maxResults?.value as
				| number
				| string
				| undefined;

			const url = new URL(
				"https://gmail.googleapis.com/gmail/v1/users/me/messages",
			);
			if (query) url.searchParams.append("q", query);
			if (maxResults) url.searchParams.append("maxResults", String(maxResults));

			const response = await fetch(url.toString(), {
				headers: { Authorization: `Bearer ${credential.accessToken}` },
			});
			return handleResponse(response, "Gmail API request failed");
		}

		if (operation === "add_label" || operation === "remove_label") {
			const messageId = params.messageId?.value as string;
			const labelIdsStr = params.labelIds?.value as string;
			const labelIds = labelIdsStr
				.split(",")
				.map((l) => l.trim())
				.filter(Boolean);

			const body =
				operation === "add_label"
					? { addLabelIds: labelIds }
					: { removeLabelIds: labelIds };

			const response = await fetch(
				`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${credential.accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				},
			);
			return handleResponse(response, "Gmail API request failed");
		}

		if (operation === "mark_read_unread") {
			const messageId = params.messageId?.value as string;
			const readStatus = params.readStatus?.value as string;

			const body =
				readStatus === "read"
					? { removeLabelIds: ["UNREAD"] }
					: { addLabelIds: ["UNREAD"] };

			const response = await fetch(
				`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${credential.accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				},
			);
			return handleResponse(response, "Gmail API request failed");
		}

		if (operation === "reply_to_email") {
			const messageId = params.messageId?.value as string;
			const to = params.to?.value as string;
			const subject = params.subject?.value as string;
			const bodyText = params.body?.value as string;

			if (!messageId) throw new Error("invalid message id");

			const originalRes = await fetch(
				`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References`,
				{ headers: { Authorization: `Bearer ${credential.accessToken}` } },
			);

			if (!originalRes.ok) {
				return {
					success: false,
					message: "Could not fetch original message to reply to",
				};
			}
			const originalData = (await originalRes.json()) as {
				threadId: string;
				payload?: {
					headers?: { name: string; value: string }[];
				};
			};
			const threadId = originalData.threadId;

			let messageIdHeader = "";
			let referencesHeader = "";

			const headers = originalData.payload?.headers || [];
			for (const h of headers) {
				if (h.name.toLowerCase() === "message-id") messageIdHeader = h.value;
				if (h.name.toLowerCase() === "references") referencesHeader = h.value;
			}

			const newReferences = referencesHeader
				? `${referencesHeader} ${messageIdHeader}`
				: messageIdHeader;

			const message = createEmailMessage(
				to,
				subject,
				bodyText,
				messageIdHeader,
				newReferences,
			);
			const encodedMessage = Buffer.from(message).toString("base64url");

			const response = await fetch(
				"https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${credential.accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						raw: encodedMessage,
						threadId: threadId,
					}),
				},
			);

			return handleResponse(response, "Gmail API request failed");
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Gmail node",
		};
	}
};
