import type { TwilioNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const TWILIO_API = "https://api.twilio.com/2010-04-01/Accounts";

const parseTwilioError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		if (body.message) return `Twilio error: ${body.message}`;
		if (body.error) return `Twilio error: ${JSON.stringify(body.error)}`;
		return `Twilio error: ${JSON.stringify(body)}`;
	} catch {
		return `Twilio error: HTTP ${res.status}`;
	}
};

export const twilioNodeExecutor = async (
	node: TwilioNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Twilio node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("twilio node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Twilio",
			};
		}

		const accountSid = credential.fields.accountSid as string;
		const authToken = credential.fields.apiKey as string;

		if (!accountSid || !authToken) {
			return {
				success: false,
				message: "Account SID and Auth Token are required",
			};
		}

		const authHeader =
			"Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

		const headers = {
			Authorization: authHeader,
		};

		const baseUrl = `${TWILIO_API}/${accountSid}`;

		if (operation === "send_sms" || operation === "send_whatsapp") {
			const to = params.to?.value as string;
			const from = params.from?.value as string;
			const bodyText = params.body?.value as string;

			if (!to || !from || !bodyText) {
				return {
					success: false,
					message: "To, From, and Message Body are required",
				};
			}

			const toNumber = operation === "send_whatsapp" ? `whatsapp:${to}` : to;
			const fromNumber = operation === "send_whatsapp" ? `whatsapp:${from}` : from;

			const formBody = new URLSearchParams();
			formBody.set("To", toNumber);
			formBody.set("From", fromNumber);
			formBody.set("Body", bodyText);

			const response = await fetch(`${baseUrl}/Messages.json`, {
				method: "POST",
				headers: {
					...headers,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: formBody.toString(),
			});

			if (response.status === 429) {
				return {
					success: false,
					message: "Twilio rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseTwilioError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Twilio response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "get_message") {
			const messageSid = params.messageSid?.value as string;
			if (!messageSid) {
				return { success: false, message: "Message SID is required" };
			}

			const response = await fetch(`${baseUrl}/Messages/${messageSid}.json`, {
				method: "GET",
				headers,
			});

			if (response.status === 429) {
				return {
					success: false,
					message: "Twilio rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseTwilioError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Twilio response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "list_messages") {
			const url = new URL(`${baseUrl}/Messages.json`);

			const maxRecords = params.maxRecords?.value as string;
			if (maxRecords) {
				url.searchParams.set("PageSize", maxRecords);
			}

			const response = await fetch(url.toString(), {
				method: "GET",
				headers,
			});

			if (response.status === 429) {
				return {
					success: false,
					message: "Twilio rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseTwilioError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Twilio response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "make_call") {
			const to = params.to?.value as string;
			const from = params.from?.value as string;
			const twiml = params.twiml?.value as string;

			if (!to || !from || !twiml) {
				return {
					success: false,
					message: "To, From, and TwiML are required",
				};
			}

			const formBody = new URLSearchParams();
			formBody.set("To", to);
			formBody.set("From", from);
			formBody.set("Twiml", twiml);

			const response = await fetch(`${baseUrl}/Calls.json`, {
				method: "POST",
				headers: {
					...headers,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: formBody.toString(),
			});

			if (response.status === 429) {
				return {
					success: false,
					message: "Twilio rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseTwilioError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Twilio response" };
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
					: "Something went wrong in Twilio node",
		};
	}
};
