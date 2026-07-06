import type { TrelloNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const TRELLO_API = "https://api.trello.com/1";

const parseTrelloError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		if (body.error) {
			const error = body.error;
			if (typeof error === "string") return `Trello error: ${error}`;
			if (typeof error === "object" && error !== null) {
				const errObj = error as Record<string, unknown>;
				if (errObj.message) return `Trello error: ${errObj.message}`;
				return `Trello error: ${JSON.stringify(error)}`;
			}
		}
		return `Trello error: ${JSON.stringify(body)}`;
	} catch {
		return `Trello error: HTTP ${res.status}`;
	}
};

export const trelloNodeExecutor = async (
	node: TrelloNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Trello node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("trello node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Trello",
			};
		}

		const apiKey = credential.fields.apiKey as string;
		const token = credential.fields.token as string;

		if (!token) {
			return {
				success: false,
				message: "Trello API token is missing from credential",
			};
		}

		if (operation === "create_card") {
			const listId = params.listId?.value as string;
			const name = params.name?.value as string;
			const description = (params.description?.value as string) || "";

			if (!listId) {
				return { success: false, message: "List ID is required" };
			}
			if (!name) {
				return { success: false, message: "Name is required" };
			}

			const url = new URL(`${TRELLO_API}/cards`);
			url.searchParams.set("key", apiKey);
			url.searchParams.set("token", token);
			url.searchParams.set("idList", listId);
			url.searchParams.set("name", name);
			if (description) {
				url.searchParams.set("desc", description);
			}

			const response = await fetch(url.toString(), { method: "POST" });

			if (!response.ok) {
				return { success: false, message: await parseTrelloError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Trello response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "get_card") {
			const cardId = params.cardId?.value as string;
			if (!cardId) {
				return { success: false, message: "Card ID is required" };
			}

			const url = new URL(`${TRELLO_API}/cards/${cardId}`);
			url.searchParams.set("key", apiKey);
			url.searchParams.set("token", token);

			const response = await fetch(url.toString(), { method: "GET" });

			if (response.status === 404) {
				return {
					success: false,
					message: `Trello error: Card not found (${cardId})`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseTrelloError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Trello response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "update_card") {
			const cardId = params.cardId?.value as string;
			const name = params.name?.value as string;
			const description = params.description?.value as string;

			if (!cardId) {
				return { success: false, message: "Card ID is required" };
			}

			const url = new URL(`${TRELLO_API}/cards/${cardId}`);
			url.searchParams.set("key", apiKey);
			url.searchParams.set("token", token);
			if (name) {
				url.searchParams.set("name", name);
			}
			if (description) {
				url.searchParams.set("desc", description);
			}

			const response = await fetch(url.toString(), { method: "PUT" });

			if (!response.ok) {
				return { success: false, message: await parseTrelloError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Trello response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "add_comment") {
			const cardId = params.cardId?.value as string;
			const commentText = params.commentText?.value as string;

			if (!cardId) {
				return { success: false, message: "Card ID is required" };
			}
			if (!commentText) {
				return { success: false, message: "Comment Text is required" };
			}

			const url = new URL(`${TRELLO_API}/cards/${cardId}/actions/comments`);
			url.searchParams.set("key", apiKey);
			url.searchParams.set("token", token);
			url.searchParams.set("text", commentText);

			const response = await fetch(url.toString(), { method: "POST" });

			if (!response.ok) {
				return { success: false, message: await parseTrelloError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Trello response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "create_board") {
			const name = params.name?.value as string;
			const description = (params.description?.value as string) || "";

			if (!name) {
				return { success: false, message: "Name is required" };
			}

			const url = new URL(`${TRELLO_API}/boards`);
			url.searchParams.set("key", apiKey);
			url.searchParams.set("token", token);
			url.searchParams.set("name", name);
			if (description) {
				url.searchParams.set("desc", description);
			}

			const response = await fetch(url.toString(), { method: "POST" });

			if (!response.ok) {
				return { success: false, message: await parseTrelloError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Trello response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "get_board") {
			const boardId = params.boardId?.value as string;
			if (!boardId) {
				return { success: false, message: "Board ID is required" };
			}

			const url = new URL(`${TRELLO_API}/boards/${boardId}`);
			url.searchParams.set("key", apiKey);
			url.searchParams.set("token", token);

			const response = await fetch(url.toString(), { method: "GET" });

			if (response.status === 404) {
				return {
					success: false,
					message: `Trello error: Board not found (${boardId})`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseTrelloError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Trello response",
				};
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
					: "Something went wrong in Trello node",
		};
	}
};
