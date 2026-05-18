import type { GmailNode, NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

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

		const to = params.to.value;
		const subject = params.subject.value;
		const bodyText = params.body.value;

		const message = [
			`To: ${to}`,
			`Subject: ${subject}`,
			"Content-Type: text/html; charset=utf-8",
			"",
			bodyText,
		].join("\n");

		const encodedMessage = Buffer.from(message).toString("base64url");

		const response = await fetch(
			"https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${credential.accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ raw: encodedMessage }),
			},
		);

		const data = await response.json();

		return {
			success: response.ok,
			output: data,
		};
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
