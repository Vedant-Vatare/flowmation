import type { ClickUpNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const CLICKUP_API = "https://api.clickup.com/api/v2";

const parseClickUpError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		if (body.err) return `ClickUp error: ${body.err}`;
		if (body.error) return `ClickUp error: ${body.error}`;
		return `ClickUp error: ${JSON.stringify(body)}`;
	} catch {
		return `ClickUp error: HTTP ${res.status}`;
	}
};

export const clickupNodeExecutor = async (
	node: ClickUpNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for ClickUp node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("clickup node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for ClickUp",
			};
		}

		const headers: Record<string, string> = {
			Authorization: `Bearer ${credential.accessToken}`,
			"Content-Type": "application/json",
		};

		if (operation === "create_task") {
			const listId = params.listId?.value as string;
			const name = params.name?.value as string;
			const description = params.description?.value as string;
			const status = params.status?.value as string;
			const priority = params.priority?.value;

			if (!listId) throw new Error("List ID is required");
			if (!name) throw new Error("Task Name is required");

			const body: Record<string, unknown> = { name };
			if (description) body.description = description;
			if (status) body.status = status;
			if (priority !== undefined && priority !== null && priority !== "") {
				body.priority = Number(priority);
			}

			const response = await fetch(`${CLICKUP_API}/list/${listId}/task`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				return { success: false, message: await parseClickUpError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse ClickUp response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "update_task") {
			const taskId = params.taskId?.value as string;
			const name = params.name?.value as string;
			const description = params.description?.value as string;
			const status = params.status?.value as string;
			const priority = params.priority?.value;

			if (!taskId) throw new Error("Task ID is required");

			const body: Record<string, unknown> = {};
			if (name) body.name = name;
			if (description) body.description = description;
			if (status) body.status = status;
			if (priority !== undefined && priority !== null && priority !== "") {
				body.priority = Number(priority);
			}

			if (Object.keys(body).length === 0) {
				return {
					success: false,
					message: "At least one field to update is required",
				};
			}

			const response = await fetch(`${CLICKUP_API}/task/${taskId}`, {
				method: "PUT",
				headers,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				return { success: false, message: await parseClickUpError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse ClickUp response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "get_task") {
			const taskId = params.taskId?.value as string;
			if (!taskId) throw new Error("Task ID is required");

			const response = await fetch(`${CLICKUP_API}/task/${taskId}`, {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				return { success: false, message: await parseClickUpError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse ClickUp response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "list_tasks") {
			const listId = params.listId?.value as string;
			const limit = params.limit?.value as string;

			if (!listId) throw new Error("List ID is required");

			const url = new URL(`${CLICKUP_API}/list/${listId}/task`);
			if (limit) {
				url.searchParams.set("page", "0");
			}

			const response = await fetch(url.toString(), {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				return { success: false, message: await parseClickUpError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse ClickUp response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "add_comment") {
			const taskId = params.taskId?.value as string;
			const commentText = params.commentText?.value as string;

			if (!taskId) throw new Error("Task ID is required");
			if (!commentText) throw new Error("Comment text is required");

			const response = await fetch(`${CLICKUP_API}/task/${taskId}/comment`, {
				method: "POST",
				headers,
				body: JSON.stringify({ comment_text: commentText }),
			});

			if (!response.ok) {
				return { success: false, message: await parseClickUpError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse ClickUp response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		if (err instanceof UnrecoverableError) throw err;
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in ClickUp node",
		};
	}
};
