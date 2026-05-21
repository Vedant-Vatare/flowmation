import type { GitHubNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const githubNodeExecutor = async (
	node: GitHubNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	const credentialId = node.credentialId;
	if (!credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for GitHub node",
		};
	}

	try {
		const credential = await getDecryptedCredential(credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for GitHub",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const operation = (params.operation?.value as string) || "get";

		const headers = {
			Authorization: `Bearer ${credential.accessToken}`,
			Accept: "application/vnd.github.v3+json",
			"Content-Type": "application/json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "Flowmation-App",
		};

		const owner = params.owner?.value as string;
		const repo = params.repo?.value as string;

		const requireRepoParams = () => {
			if (!owner || !repo) {
				throw new Error("Owner and Repository are required for this operation");
			}
		};

		const parseList = (val: unknown) => {
			if (!val) return undefined;
			if (Array.isArray(val)) return val.map(String);
			if (typeof val === "string") {
				return val
					.split(",")
					.map((l) => l.trim())
					.filter(Boolean);
			}
			return [String(val)];
		};

		if (operation === "list_repos") {
			const type = (params.type?.value as string) || "all";
			const perPage = (params.per_page?.value as string) || "30";
			const response = await fetch(
				`https://api.github.com/user/repos?type=${type}&per_page=${perPage}`,
				{ headers },
			);
			return handleResponse(response);
		}

		if (operation === "get_repository") {
			requireRepoParams();
			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}`,
				{ headers },
			);
			return handleResponse(response);
		}

		if (operation === "list_issues") {
			requireRepoParams();
			const state = (params.state?.value as string) || "open";
			const perPage = (params.per_page?.value as string) || "30";
			const labels = params.labels?.value as string;
			const assignee = params.assignee?.value as string;

			const url = new URL(
				`https://api.github.com/repos/${owner}/${repo}/issues`,
			);
			if (state !== "all") url.searchParams.append("state", state);
			url.searchParams.append("per_page", perPage);
			if (labels) url.searchParams.append("labels", labels);
			if (assignee) url.searchParams.append("assignee", assignee);

			const response = await fetch(url.toString(), { headers });
			return handleResponse(response);
		}

		if (operation === "get_issue") {
			requireRepoParams();
			const issueNumber = params.issue_number?.value as string;
			if (!issueNumber) throw new Error("Issue Number is required");

			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
				{ headers },
			);
			return handleResponse(response);
		}

		if (operation === "create_issue") {
			requireRepoParams();
			const title = params.title?.value as string;
			if (!title) throw new Error("Title is required for creating an issue");

			const body = params.body?.value as string;
			const labels = parseList(params.labels?.value);
			const assignees = parseList(params.assignees?.value);

			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/issues`,
				{
					method: "POST",
					headers,
					body: JSON.stringify({ title, body, labels, assignees }),
				},
			);
			return handleResponse(response);
		}

		if (operation === "update_issue") {
			requireRepoParams();
			const issueNumber = params.issue_number?.value as string;
			if (!issueNumber) throw new Error("Issue Number is required");

			const title = params.title?.value as string;
			const body = params.body?.value as string;
			const state = params.state?.value as string;
			const labels = parseList(params.labels?.value);
			const assignees = parseList(params.assignees?.value);

			const payload: Record<string, string | string[]> = {};
			if (title) payload.title = title;
			if (body) payload.body = body;
			if (state && state !== "all") payload.state = state;
			if (labels) payload.labels = labels;
			if (assignees) payload.assignees = assignees;

			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
				{
					method: "PATCH",
					headers,
					body: JSON.stringify(payload),
				},
			);
			return handleResponse(response);
		}

		if (operation === "list_prs") {
			requireRepoParams();
			const state = (params.state?.value as string) || "open";
			const perPage = (params.per_page?.value as string) || "30";
			const base = params.base?.value as string;

			const url = new URL(
				`https://api.github.com/repos/${owner}/${repo}/pulls`,
			);
			if (state !== "all") url.searchParams.append("state", state);
			url.searchParams.append("per_page", perPage);
			if (base) url.searchParams.append("base", base);

			const response = await fetch(url.toString(), { headers });
			return handleResponse(response);
		}

		if (operation === "get_pr") {
			requireRepoParams();
			const pullNumber = params.pull_number?.value as string;
			if (!pullNumber) throw new Error("Pull Request Number is required");

			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
				{ headers },
			);
			return handleResponse(response);
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in GitHub node",
		};
	}
};
