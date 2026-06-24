import type { LinearNode } from "@nodebase/shared";
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

const graphqlRequest = async (
	endpoint: string,
	headers: Record<string, string>,
	query: string,
	variables?: Record<string, unknown>,
): Promise<{ data?: unknown; errors?: unknown }> => {
	const response = await fetch(endpoint, {
		method: "POST",
		headers,
		body: JSON.stringify({ query, variables }),
	});

	const result = await response.json().catch(() => ({})) as { data?: unknown; errors?: Array<{ message: string }> };

	if (result.errors?.length) {
		throw new Error(toErrorMessage(result.errors[0]?.message));
	}
	return result;
};

export const linearNodeExecutor = async (
	node: LinearNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return { success: false, message: "Credential ID is missing for Linear node" };
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation) throw new UnrecoverableError("Linear node operation is invalid");

		let headers: Record<string, string>;

		if (credential.type === "apiKey") {
			const fields = credential.fields ?? {};
			const apiKey = fields.apiKey as string;
			if (!apiKey) {
				return { success: false, message: "Missing API key for Linear" };
			}
			headers = {
				Authorization: apiKey,
				"Content-Type": "application/json",
			};
		} else if (credential.type === "oauth2" && credential.accessToken) {
			headers = {
				Authorization: `Bearer ${credential.accessToken}`,
				"Content-Type": "application/json",
			};
		} else {
			return { success: false, message: "Invalid credential format for Linear" };
		}

		const endpoint = "https://api.linear.app/graphql";

		if (operation === "list_teams") {
			const result = await graphqlRequest(
				endpoint,
				headers,
				`query Teams { teams { nodes { id name key description } } }`,
			);
			return { success: true, output: result.data };
		}

		if (operation === "create_issue") {
			const teamId = params.team_id?.value as string;
			const title = params.title?.value as string;
			if (!teamId || !title) throw new Error("Team ID and Title are required");

			const description = params.description?.value as string;
			const priority = Number(params.priority?.value) || 3;
			const assigneeId = params.assignee_id?.value as string;
			const stateId = params.state_id?.value as string;
			const labels = params.labels?.value as string;

			const input: Record<string, unknown> = { teamId, title };
			if (description) input.description = description;
			if (priority) input.priority = priority;
			if (assigneeId) input.assigneeId = assigneeId;
			if (stateId) input.stateId = stateId;
			if (labels) {
				input.labelIds = labels.split(",").map((l) => l.trim()).filter(Boolean);
			}

			const result = await graphqlRequest(
				endpoint,
				headers,
				`mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url } } }`,
				{ input },
			);
			return { success: true, output: result.data };
		}

		if (operation === "update_issue") {
			const issueId = params.issue_id?.value as string;
			if (!issueId) throw new Error("Issue ID is required");

			const input: Record<string, unknown> = {};
			const title = params.title?.value as string;
			const description = params.description?.value as string;
			const priority = params.priority?.value as string;
			const assigneeId = params.assignee_id?.value as string;
			const stateId = params.state_id?.value as string;

			if (title) input.title = title;
			if (description) input.description = description;
			if (priority) input.priority = Number(priority);
			if (assigneeId) input.assigneeId = assigneeId;
			if (stateId) input.stateId = stateId;

			if (Object.keys(input).length === 0) {
				throw new Error("At least one field to update is required");
			}

			const result = await graphqlRequest(
				endpoint,
				headers,
				`mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { id identifier title } } }`,
				{ id: issueId, input },
			);
			return { success: true, output: result.data };
		}

		if (operation === "get_issue") {
			const issueId = params.issue_id?.value as string;
			if (!issueId) throw new Error("Issue ID is required");

			const result = await graphqlRequest(
				endpoint,
				headers,
				`query GetIssue($id: String!) { issue(id: $id) { id identifier title description priority state { name } assignee { name } team { name } labels { nodes { name } } createdAt updatedAt } }`,
				{ id: issueId },
			);
			return { success: true, output: result.data };
		}

		if (operation === "list_issues") {
			const teamId = params.team_id?.value as string;
			const filterStr = params.filter?.value as string;
			const limit = Number(params.limit?.value) || 50;

			let filter: Record<string, unknown> = {};
			if (filterStr) {
				try {
					filter = JSON.parse(filterStr);
				} catch {
					throw new Error("Invalid filter JSON");
				}
			}
			if (teamId) {
				filter = { ...filter, team: { id: { eq: teamId } } };
			}

			const result = await graphqlRequest(
				endpoint,
				headers,
				`query ListIssues($filter: IssueFilter, $first: Int) { issues(filter: $filter, first: $first) { nodes { id identifier title priority state { name } assignee { name } createdAt } } }`,
				{ filter, first: limit },
			);
			return { success: true, output: result.data };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		if (err instanceof UnrecoverableError) throw err;
		return {
			success: false,
			message: err instanceof Error ? err.message : "Something went wrong in Linear node",
		};
	}
};
