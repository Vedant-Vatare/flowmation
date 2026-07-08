import type { TodoistNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const TODOIST_API_BASE = "https://api.todoist.com/api/v1";

const parseTodoistError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		if (body.error) return `Todoist error: ${body.error}`;
		if (body.error_tag) return `Todoist error: ${body.error_tag}`;
		return `Todoist error: ${JSON.stringify(body)}`;
	} catch {
		return `Todoist error: HTTP ${res.status}`;
	}
};

export const todoistNodeExecutor = async (
	node: TodoistNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Todoist node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for Todoist",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation) throw new Error("todoist node operation is invalid");

		const headers = {
			Authorization: `Bearer ${credential.accessToken}`,
			"Content-Type": "application/json",
		};

		if (operation === "create_task") {
			const content = params.content?.value as string;
			if (!content) {
				return { success: false, message: "Content is required" };
			}

			const body: Record<string, unknown> = { content };

			const projectId = params.project_id?.value as string;
			if (projectId) body.project_id = projectId;

			const description = params.description?.value as string;
			if (description) body.description = description;

			const priority = params.priority?.value as string;
			if (priority) body.priority = Number(priority);

			const dueString = params.due_string?.value as string;
			if (dueString) body.due_string = dueString;

			const labels = params.labels?.value as string;
			if (labels) body.labels = labels.split(",").map((l) => l.trim());

			const response = await fetch(`${TODOIST_API_BASE}/tasks`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			return handleResponse(response, await parseTodoistError(response));
		}

		if (operation === "get_task") {
			const taskId = params.task_id?.value as string;
			if (!taskId) {
				return { success: false, message: "Task ID is required" };
			}

			const response = await fetch(
				`${TODOIST_API_BASE}/tasks/${encodeURIComponent(taskId)}`,
				{
					headers,
				},
			);

			return handleResponse(response, await parseTodoistError(response));
		}

		if (operation === "update_task") {
			const taskId = params.task_id?.value as string;
			if (!taskId) {
				return { success: false, message: "Task ID is required" };
			}

			const body: Record<string, unknown> = {};

			const content = params.content?.value as string;
			if (content) body.content = content;

			const description = params.description?.value as string;
			if (description) body.description = description;

			const priority = params.priority?.value as string;
			if (priority) body.priority = Number(priority);

			const dueString = params.due_string?.value as string;
			if (dueString) body.due_string = dueString;

			const labels = params.labels?.value as string;
			if (labels) body.labels = labels.split(",").map((l) => l.trim());

			if (Object.keys(body).length === 0) {
				return {
					success: false,
					message: "Provide at least one field to update",
				};
			}

			const response = await fetch(
				`${TODOIST_API_BASE}/tasks/${encodeURIComponent(taskId)}`,
				{
					method: "POST",
					headers,
					body: JSON.stringify(body),
				},
			);

			return handleResponse(response, await parseTodoistError(response));
		}

		if (operation === "complete_task") {
			const taskId = params.task_id?.value as string;
			if (!taskId) {
				return { success: false, message: "Task ID is required" };
			}

			const response = await fetch(
				`${TODOIST_API_BASE}/tasks/${encodeURIComponent(taskId)}/close`,
				{
					method: "POST",
					headers,
				},
			);

			if (!response.ok) {
				const message = await parseTodoistError(response);
				return { success: false, message };
			}

			return { success: true, message: "Task completed" };
		}

		if (operation === "delete_task") {
			const taskId = params.task_id?.value as string;
			if (!taskId) {
				return { success: false, message: "Task ID is required" };
			}

			const response = await fetch(
				`${TODOIST_API_BASE}/tasks/${encodeURIComponent(taskId)}`,
				{
					method: "DELETE",
					headers,
				},
			);

			if (!response.ok) {
				const message = await parseTodoistError(response);
				return { success: false, message };
			}

			return { success: true, message: "Task deleted" };
		}

		if (operation === "list_projects") {
			const response = await fetch(`${TODOIST_API_BASE}/projects`, {
				headers,
			});

			return handleResponse(response, await parseTodoistError(response));
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Todoist node",
		};
	}
};
