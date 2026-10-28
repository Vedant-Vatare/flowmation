import type { DiscordNode } from "@nodebase/shared";
import type { DecryptedCredential, NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const discordRequest = async (
	path: string,
	botToken: string,
	body: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
	const response = await fetch(`https://discord.com/api/v10${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bot ${botToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(10000),
	});
	let data: unknown;
	try {
		data = await response.json();
	} catch {
		throw new Error(
			`Discord returned an invalid response (HTTP ${response.status})`,
		);
	}
	if (!response.ok) {
		const code =
			data && typeof data === "object" && "code" in data
				? data.code
				: undefined;
		if (code === 50007)
			throw new Error(
				"Discord cannot send a DM to this user. Check their privacy settings and access to the bot.",
			);
		if (response.status === 401)
			throw new Error("Discord bot token is invalid or revoked");
		if (response.status === 429)
			throw new Error("Discord rate limit reached. Try again shortly.");
		throw new Error(
			`Discord request failed (HTTP ${response.status}${typeof code === "number" ? `, code ${code}` : ""})`,
		);
	}
	if (!data || typeof data !== "object" || Array.isArray(data))
		throw new Error("Discord returned an invalid response");
	return data as Record<string, unknown>;
};

export const discordNodeExecutor = async (
	node: DiscordNode,
	executionId: string,
	credential: DecryptedCredential | null,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value || "send_webhook";
		if (operation === "send_dm") {
			if (!credential)
				return {
					success: false,
					message: "Select a Discord Bot credential to send DMs",
				};
			const userId = params.userId?.value;
			const message = params.message?.value;
			if (typeof userId !== "string" || !/^\d+$/.test(userId))
				return {
					success: false,
					message: "A valid Discord user ID is required",
				};
			if (
				typeof message !== "string" ||
				!message.trim() ||
				message.length > 2000
			)
				return {
					success: false,
					message: "DM message must contain between 1 and 2000 characters",
				};
			const botToken =
				credential.type === "apiKey" ? credential.fields?.botToken : undefined;
			if (!botToken)
				return { success: false, message: "Invalid Discord Bot credential" };
			const channel = await discordRequest("/users/@me/channels", botToken, {
				recipient_id: userId,
			});
			if (typeof channel.id !== "string" || !/^\d+$/.test(channel.id))
				throw new Error("Discord did not return a valid DM channel");
			const sent = await discordRequest(
				`/channels/${channel.id}/messages`,
				botToken,
				{ content: message, allowed_mentions: { parse: [] } },
			);
			if (typeof sent.id !== "string" || !/^\d+$/.test(sent.id))
				throw new Error("Discord did not confirm the sent DM");
			return {
				success: true,
				status: "completed",
				message: "DM sent",
				output: {
					messageId: sent.id,
					channelId: channel.id,
					userId,
					content: sent.content ?? message,
				},
			};
		}
		if (operation !== "send_webhook")
			return { success: false, message: "Unsupported Discord operation" };

		const webhookResponse = await fetch(params.webhookUrl.value, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: params.message.value,
				username: params.botName?.value || undefined,
			}),
		});

		if (!webhookResponse.ok) {
			const error = await webhookResponse.text();
			return { success: false, message: error };
		}

		return {
			success: true,
			status: "completed",
			message: "webhook request was sent",
			output: webhookResponse.status,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Discord request failed",
		};
	}
};
