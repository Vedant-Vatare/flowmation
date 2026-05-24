import type { TelegramNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const TELEGRAM_API = "https://api.telegram.org/bot";

export const telegramNodeExecutor = async (
	node: TelegramNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Telegram node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("telegram node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Telegram",
			};
		}

		const botToken = credential.fields.apiKey as string;
		const chatId = params.chatId?.value as string;

		if (!chatId) {
			return { success: false, message: "Chat ID is required" };
		}

		if (operation === "send_message") {
			const text = params.text?.value as string;
			const parseMode = params.parseMode?.value as string;

			if (!text) {
				return { success: false, message: "Message text is required" };
			}

			const body: Record<string, unknown> = {
				chat_id: chatId,
				text,
			};

			if (parseMode && parseMode !== "none") {
				body.parse_mode = parseMode;
			}

			const response = await fetch(
				`${TELEGRAM_API}${botToken}/sendMessage`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);

			const data = (await response.json()) as Record<string, unknown>;

			if (!data.ok) {
				return {
					success: false,
					message: `Telegram error: ${data.description}`,
					output: data,
				};
			}

			return { success: true, output: data };
		}

		if (operation === "send_photo") {
			const photo = params.photo?.value as string;
			const caption = params.caption?.value as string;

			if (!photo) {
				return { success: false, message: "Photo URL is required" };
			}

			const body: Record<string, unknown> = {
				chat_id: chatId,
				photo,
			};

			if (caption) {
				body.caption = caption;
			}

			const response = await fetch(
				`${TELEGRAM_API}${botToken}/sendPhoto`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);

			const data = (await response.json()) as Record<string, unknown>;

			if (!data.ok) {
				return {
					success: false,
					message: `Telegram error: ${data.description}`,
					output: data,
				};
			}

			return { success: true, output: data };
		}

		if (operation === "send_document") {
			const document = params.document?.value as string;
			const caption = params.caption?.value as string;

			if (!document) {
				return { success: false, message: "Document URL is required" };
			}

			const body: Record<string, unknown> = {
				chat_id: chatId,
				document,
			};

			if (caption) {
				body.caption = caption;
			}

			const response = await fetch(
				`${TELEGRAM_API}${botToken}/sendDocument`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);

			const data = (await response.json()) as Record<string, unknown>;

			if (!data.ok) {
				return {
					success: false,
					message: `Telegram error: ${data.description}`,
					output: data,
				};
			}

			return { success: true, output: data };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		if (err instanceof UnrecoverableError) throw err;
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Telegram node",
		};
	}
};
