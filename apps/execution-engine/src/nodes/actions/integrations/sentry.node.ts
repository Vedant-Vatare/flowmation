import type { SentryNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const SENTRY_API = "https://sentry.io/api/0";

const parseSentryError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		if (body.detail) return `Sentry error: ${body.detail}`;
		const errors = Object.entries(body)
			.map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
			.join(", ");
		if (errors) return `Sentry error: ${errors}`;
		return `Sentry error: HTTP ${res.status}`;
	} catch {
		return `Sentry error: HTTP ${res.status}`;
	}
};

export const sentryNodeExecutor = async (
	node: SentryNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Sentry node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("sentry node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Sentry",
			};
		}

		const authToken = credential.fields.apiKey as string;
		const orgSlug = params.orgSlug?.value as string;

		if (!authToken) {
			return { success: false, message: "Auth Token is required" };
		}

		if (!orgSlug) {
			return { success: false, message: "Organization Slug is required" };
		}

		const headers = {
			Authorization: `Bearer ${authToken}`,
			"Content-Type": "application/json",
		};

		if (operation === "list_issues") {
			const url = new URL(`${SENTRY_API}/organizations/${orgSlug}/issues/`);

			const limit = params.limit?.value as string;
			if (limit) {
				url.searchParams.set("limit", limit);
			}

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				return {
					success: false,
					message: "Sentry rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseSentryError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Sentry response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "get_issue") {
			const issueId = params.issueId?.value as string;
			if (!issueId) {
				return { success: false, message: "Issue ID is required" };
			}

			const response = await fetch(
				`${SENTRY_API}/organizations/${orgSlug}/issues/${issueId}/`,
				{ method: "GET", headers },
			);

			if (response.status === 429) {
				return {
					success: false,
					message: "Sentry rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseSentryError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Sentry response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "update_issue") {
			const issueId = params.issueId?.value as string;
			const status = params.status?.value as string;

			if (!issueId) {
				return { success: false, message: "Issue ID is required" };
			}
			if (!status) {
				return { success: false, message: "Status is required" };
			}

			const response = await fetch(
				`${SENTRY_API}/organizations/${orgSlug}/issues/${issueId}/`,
				{
					method: "PUT",
					headers,
					body: JSON.stringify({ status }),
				},
			);

			if (response.status === 429) {
				return {
					success: false,
					message: "Sentry rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseSentryError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Sentry response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "list_projects") {
			const url = new URL(
				`${SENTRY_API}/organizations/${orgSlug}/projects/`,
			);

			const limit = params.limit?.value as string;
			if (limit) {
				url.searchParams.set("per_page", limit);
			}

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				return {
					success: false,
					message: "Sentry rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseSentryError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Sentry response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "list_releases") {
			const url = new URL(
				`${SENTRY_API}/organizations/${orgSlug}/releases/`,
			);

			const limit = params.limit?.value as string;
			if (limit) {
				url.searchParams.set("per_page", limit);
			}

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				return {
					success: false,
					message: "Sentry rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseSentryError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Sentry response" };
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "create_release") {
			const version = params.version?.value as string;
			const projectsRaw = params.projects?.value as string;

			if (!version) {
				return { success: false, message: "Release Version is required" };
			}
			if (!projectsRaw) {
				return { success: false, message: "Projects are required" };
			}

			const projects = projectsRaw
				.split(",")
				.map((p) => p.trim())
				.filter(Boolean);

			if (projects.length === 0) {
				return {
					success: false,
					message: "At least one project slug is required",
				};
			}

			const response = await fetch(
				`${SENTRY_API}/organizations/${orgSlug}/releases/`,
				{
					method: "POST",
					headers,
					body: JSON.stringify({ version, projects }),
				},
			);

			if (response.status === 429) {
				return {
					success: false,
					message: "Sentry rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseSentryError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return { success: false, message: "Failed to parse Sentry response" };
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
					: "Something went wrong in Sentry node",
		};
	}
};
