import type { SlackNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const slackNodeExecutor = async (
	node: SlackNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Slack node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("slack node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return { success: false, message: "Invalid credential format for Slack" };
		}

		if (operation === "send_message") {
			const channel = params.channel?.value as string;
			const text = params.text?.value as string;

			if (!channel || !text) {
				return {
					success: false,
					message: "Channel and message text are required",
				};
			}

			const response = await fetch("https://slack.com/api/chat.postMessage", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${credential.accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ channel, text }),
			});

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") ?? "60";
				throw new Error(`Slack rate limited. Retry after ${retryAfter}s`);
			}

			// THE FIX: check Slack's ok field, not HTTP status
			const data = (await response.json()) as Record<string, unknown>;
			if (!data.ok) {
				return { success: false, message: `Slack error: ${data.error}` };
			}

			return { success: true, output: data };
		}

		if (operation === "invite_to_channel") {
			const channel = params.channel?.value as string;
			const users = params.users?.value as string;

			if (!channel || !users) {
				return { success: false, message: "Channel and user IDs are required" };
			}

			const response = await fetch(
				"https://slack.com/api/conversations.invite",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${credential.accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ channel, users }),
				},
			);

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") ?? "60";
				throw new Error(`Slack rate limited. Retry after ${retryAfter}s`);
			}

			const data = (await response.json()) as Record<string, unknown>;
			if (!data.ok) {
				return { success: false, message: `Slack error: ${data.error}` };
			}

			return { success: true, output: data, status: "completed" };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Slack node",
		};
	}
};
