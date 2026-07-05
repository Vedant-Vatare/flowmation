import type { AsanaNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const ASANA_API = "https://app.asana.com/api/1.0";

const parseAsanaError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as {
			errors?: { message: string }[];
		};
		if (body.errors?.length) {
			return `Asana error: ${body.errors.map((e) => e.message).join(", ")}`;
		}
		return `Asana error: HTTP ${res.status}`;
	} catch {
		return `Asana error: HTTP ${res.status}`;
	}
};

export const asanaNodeExecutor = async (
	node: AsanaNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Asana node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("asana node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Asana",
			};
		}

		const token = credential.fields.apiKey as string;

		if (!token) {
			return { success: false, message: "Personal Access Token is required" };
		}

		const headers = {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		};

		if (operation === "list_workspaces") {
			const url = new URL(`${ASANA_API}/workspaces`);

			const limit = params.limit?.value as string;
			if (limit) {
				url.searchParams.set("limit", limit);
			}

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") || "60";
				return {
					success: false,
					message: `Asana rate limit exceeded. Retry after ${retryAfter}s.`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseAsanaError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Asana response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "list_projects") {
			const workspaceGid = params.workspaceGid?.value as string;
			if (!workspaceGid) {
				return { success: false, message: "Workspace GID is required" };
			}

			const url = new URL(`${ASANA_API}/projects`);
			url.searchParams.set("workspace", workspaceGid);

			const limit = params.limit?.value as string;
			if (limit) {
				url.searchParams.set("limit", limit);
			}

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") || "60";
				return {
					success: false,
					message: `Asana rate limit exceeded. Retry after ${retryAfter}s.`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseAsanaError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Asana response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "list_tasks") {
			const projectGid = params.projectGid?.value as string;
			if (!projectGid) {
				return { success: false, message: "Project GID is required" };
			}

			const url = new URL(`${ASANA_API}/projects/${projectGid}/tasks`);
			url.searchParams.set("opt_fields", "name,completed,assignee,due_on");

			const limit = params.limit?.value as string;
			if (limit) {
				url.searchParams.set("limit", limit);
			}

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") || "60";
				return {
					success: false,
					message: `Asana rate limit exceeded. Retry after ${retryAfter}s.`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseAsanaError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Asana response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "get_task") {
			const taskGid = params.taskGid?.value as string;
			if (!taskGid) {
				return { success: false, message: "Task GID is required" };
			}

			const url = new URL(`${ASANA_API}/tasks/${taskGid}`);
			url.searchParams.set(
				"opt_fields",
				"name,completed,notes,assignee,due_on,projects",
			);

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") || "60";
				return {
					success: false,
					message: `Asana rate limit exceeded. Retry after ${retryAfter}s.`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseAsanaError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Asana response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "create_task") {
			const workspaceGid = params.workspaceGid?.value as string;
			const name = params.name?.value as string;
			const projectGid = params.projectGid?.value as string;
			const notes = params.notes?.value as string;
			const dueOn = params.dueOn?.value as string;

			if (!workspaceGid) {
				return { success: false, message: "Workspace GID is required" };
			}
			if (!name) {
				return { success: false, message: "Task Name is required" };
			}

			const body: Record<string, unknown> = {
				data: {
					workspace: workspaceGid,
					name,
				},
			};

			if (projectGid) {
				(body.data as Record<string, unknown>).projects = [projectGid];
			}
			if (notes) {
				(body.data as Record<string, unknown>).notes = notes;
			}
			if (dueOn) {
				(body.data as Record<string, unknown>).due_on = dueOn;
			}

			const response = await fetch(`${ASANA_API}/tasks`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") || "60";
				return {
					success: false,
					message: `Asana rate limit exceeded. Retry after ${retryAfter}s.`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseAsanaError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Asana response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "update_task") {
			const taskGid = params.taskGid?.value as string;
			const completed = params.completed?.value as string;

			if (!taskGid) {
				return { success: false, message: "Task GID is required" };
			}

			const body: Record<string, unknown> = {
				data: {
					completed: completed === "true",
				},
			};

			const response = await fetch(`${ASANA_API}/tasks/${taskGid}`, {
				method: "PUT",
				headers,
				body: JSON.stringify(body),
			});

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") || "60";
				return {
					success: false,
					message: `Asana rate limit exceeded. Retry after ${retryAfter}s.`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseAsanaError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Asana response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "complete_task") {
			const taskGid = params.taskGid?.value as string;
			if (!taskGid) {
				return { success: false, message: "Task GID is required" };
			}

			const body: Record<string, unknown> = {
				data: {
					completed: true,
				},
			};

			const response = await fetch(`${ASANA_API}/tasks/${taskGid}`, {
				method: "PUT",
				headers,
				body: JSON.stringify(body),
			});

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After") || "60";
				return {
					success: false,
					message: `Asana rate limit exceeded. Retry after ${retryAfter}s.`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseAsanaError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Asana response" };
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
					: "Something went wrong in Asana node",
		};
	}
};
