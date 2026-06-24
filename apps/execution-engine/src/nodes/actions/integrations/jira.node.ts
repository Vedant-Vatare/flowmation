import type { JiraNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const toErrorMessage = (err: unknown): string => {
	if (typeof err === "string") return err;
	if (err && typeof err === "object" && "message" in err && typeof err.message === "string")
		return err.message;
	return JSON.stringify(err);
};

export const jiraNodeExecutor = async (
	node: JiraNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return { success: false, message: "Credential ID is missing for Jira node" };
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation) throw new UnrecoverableError("Jira node operation is invalid");

		let baseUrl: string;
		let headers: Record<string, string>;

		if (credential.type === "apiKey") {
			const fields = credential.fields ?? {};
			const email = fields.email as string;
			const apiToken = fields.apiKey as string;
			const domain = fields.domain as string;
			if (!email || !apiToken || !domain) {
				return { success: false, message: "Missing email, API token, or domain for Jira API Token auth" };
			}
			baseUrl = `https://${domain}`;
			const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
			headers = {
				Authorization: `Basic ${auth}`,
				Accept: "application/json",
				"Content-Type": "application/json",
			};
		} else if (credential.type === "oauth2" && credential.accessToken) {
			const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
				headers: { Authorization: `Bearer ${credential.accessToken}`, Accept: "application/json" },
			});
			if (!resourcesRes.ok) {
				return { success: false, message: "Failed to fetch Jira accessible resources" };
			}
			const resources = (await resourcesRes.json()) as Array<{ id: string; url: string }>;
			if (!resources.length) {
				return { success: false, message: "No Jira sites accessible with this token" };
			}
			const cloudId = resources[0]?.id;
			if (!cloudId) {
				return { success: false, message: "Could not determine Jira cloud ID" };
			}
			baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
			headers = {
				Authorization: `Bearer ${credential.accessToken}`,
				Accept: "application/json",
				"Content-Type": "application/json",
			};
		} else {
			return { success: false, message: "Invalid credential format for Jira" };
		}

		if (operation === "create_issue") {
			const projectKey = params.project_key?.value as string;
			const summary = params.summary?.value as string;
			if (!projectKey || !summary) throw new Error("Project Key and Summary are required");

			const issueType = (params.issue_type?.value as string) || "Task";
			const description = params.description?.value as string;
			const priority = params.priority?.value as string;
			const assignee = params.assignee?.value as string;
			const labels = params.labels?.value as string;

			const fields: Record<string, unknown> = {
				project: { key: projectKey },
				summary,
				issuetype: { name: issueType },
			};
			if (description) fields.description = description;
			if (priority) fields.priority = { name: priority };
			if (assignee) fields.assignee = { name: assignee };
			if (labels) fields.labels = labels.split(",").map((l) => l.trim()).filter(Boolean);

			const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
				method: "POST",
				headers,
				body: JSON.stringify({ fields }),
			});

			const data = await response.json().catch(() => ({})) as Record<string, unknown>;
			if (!response.ok) {
				return { success: false, message: toErrorMessage(data.errorMessages || data.errors || data), output: data };
			}
			return { success: true, output: data };
		}

		if (operation === "update_issue") {
			const issueKey = params.issue_key?.value as string;
			if (!issueKey) throw new Error("Issue Key is required");

			const fields: Record<string, unknown> = {};
			const summary = params.summary?.value as string;
			const description = params.description?.value as string;
			const status = params.status?.value as string;
			const priority = params.priority?.value as string;
			const assignee = params.assignee?.value as string;
			const labels = params.labels?.value as string;

			if (summary) fields.summary = summary;
			if (description) fields.description = description;
			if (priority) fields.priority = { name: priority };
			if (assignee) fields.assignee = { name: assignee };
			if (labels) fields.labels = labels.split(",").map((l) => l.trim()).filter(Boolean);

			const response = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({ fields }),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({})) as Record<string, unknown>;
				return { success: false, message: toErrorMessage(data.errorMessages || data.errors || data), output: data };
			}
			return { success: true, output: { message: `Issue ${issueKey} updated successfully` } };
		}

		if (operation === "get_issue") {
			const issueKey = params.issue_key?.value as string;
			if (!issueKey) throw new Error("Issue Key is required");

			const response = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}`, {
				method: "GET",
				headers,
			});

			const data = await response.json().catch(() => ({})) as Record<string, unknown>;
			if (!response.ok) {
				return { success: false, message: toErrorMessage(data.errorMessages || data.errors || data), output: data };
			}
			return { success: true, output: data };
		}

		if (operation === "list_issues") {
			const projectKey = params.project_key?.value as string;
			const jql = params.jql?.value as string;
			const maxResults = Number(params.max_results?.value) || 50;

			let jqlQuery = jql || "";
			if (projectKey && !jql) {
				jqlQuery = `project = "${projectKey}"`;
			}
			if (!jqlQuery) throw new Error("Either Project Key or JQL Query is required");

			const body: Record<string, unknown> = {
				jql: jqlQuery,
				maxResults,
			};

			const response = await fetch(`${baseUrl}/rest/api/3/search`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			const data = await response.json().catch(() => ({})) as Record<string, unknown>;
			if (!response.ok) {
				return { success: false, message: toErrorMessage(data.errorMessages || data.errors || data), output: data };
			}
			return { success: true, output: data };
		}

		if (operation === "transition_issue") {
			const issueKey = params.issue_key?.value as string;
			const transitionId = params.transition_id?.value as string;
			if (!issueKey || !transitionId) throw new Error("Issue Key and Transition ID are required");

			const comment = params.comment?.value as string;

			const payload: Record<string, unknown> = {
				transition: { id: transitionId },
			};
			if (comment) {
				payload.update = {
					comment: [{ add: { body: comment } }],
				};
			}

			const response = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({})) as Record<string, unknown>;
				return { success: false, message: toErrorMessage(data.errorMessages || data.errors || data), output: data };
			}
			return { success: true, output: { message: `Issue ${issueKey} transitioned successfully` } };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		if (err instanceof UnrecoverableError) throw err;
		return {
			success: false,
			message: err instanceof Error ? err.message : "Something went wrong in Jira node",
		};
	}
};
