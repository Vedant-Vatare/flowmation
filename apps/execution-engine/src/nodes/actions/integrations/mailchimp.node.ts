import { createHash } from "node:crypto";
import type { MailchimpNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const parseJson = (value: string | undefined, paramName: string): unknown => {
	if (!value || !value.trim()) return undefined;
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`Invalid JSON in ${paramName}: ${value}`);
	}
};

const emailToHash = (email: string): string =>
	createHash("md5").update(email.toLowerCase().trim()).digest("hex");

export const mailchimpNodeExecutor = async (
	node: MailchimpNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Mailchimp node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey") {
			return {
				success: false,
				message: "Invalid credential format for Mailchimp",
			};
		}

		const apiKey = (credential.fields as Record<string, string>)?.apiKey;
		const serverPrefix = (credential.fields as Record<string, string>)
			?.serverPrefix;

		if (!apiKey || !serverPrefix) {
			return {
				success: false,
				message: "API Key and Server Prefix are required",
			};
		}

		const baseUrl = `https://${serverPrefix}.api.mailchimp.com/3.0`;
		const authHeader = `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`;

		const params = await getResolvedParams(node, executionId);
		const resource = params.resource?.value as string;

		if (!resource) return { success: false, message: "Resource is required" };

		const listId = params.listId?.value as string;
		const email = params.email?.value as string;
		const status = params.status?.value as string;
		const mergeFields = params.mergeFields?.value as string;
		const tags = params.tags?.value as string;
		const campaignId = params.campaignId?.value as string;
		const campaignName = params.campaignName?.value as string;
		const subject = params.subject?.value as string;
		const fromName = params.fromName?.value as string;
		const replyTo = params.replyTo?.value as string;
		const limit = params.limit?.value as string;
		const campaignListId = params.campaignListId?.value as string;

		const mailchimpRequest = async (
			path: string,
			method: string,
			body?: unknown,
		): Promise<unknown> => {
			const url = `${baseUrl}${path}`;
			const headers: Record<string, string> = {
				Authorization: authHeader,
				"Content-Type": "application/json",
			};

			const res = await fetch(url, {
				method,
				headers,
				body: body ? JSON.stringify(body) : undefined,
			});

			if (!res.ok) {
				const errBody = (await res.json().catch(() => ({}))) as Record<
					string,
					unknown
				>;
				const detail = (errBody.detail as string) || res.statusText;
				throw new Error(`Mailchimp API error (${res.status}): ${detail}`);
			}

			if (res.status === 204)
				return { success: true, output: null, status: "completed" };
			return res.json();
		};

		let result: unknown;

		if (resource === "member") {
			const operation = params.memberOperation?.value as string;
			if (!operation)
				return { success: false, message: "Member operation is required" };

			if (!listId) return { success: false, message: "List ID is required" };

			if (operation === "create") {
				if (!email) return { success: false, message: "Email is required" };
				if (!status) return { success: false, message: "Status is required" };

				const body: Record<string, unknown> = {
					email_address: email,
					status,
				};

				const mergeFieldsParsed = parseJson(mergeFields, "mergeFields");
				if (mergeFieldsParsed) body.merge_fields = mergeFieldsParsed;

				result = await mailchimpRequest(
					`/lists/${listId}/members`,
					"POST",
					body,
				);

				if (tags && result && typeof result === "object" && "id" in result) {
					const tagList = tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean);
					if (tagList.length > 0) {
						await mailchimpRequest(
							`/lists/${listId}/members/${(result as { id: string }).id}/tags`,
							"POST",
							{ tags: tagList.map((name) => ({ name, status: "active" })) },
						);
					}
				}
			} else if (operation === "get") {
				if (!email) return { success: false, message: "Email is required" };
				const hash = emailToHash(email);
				result = await mailchimpRequest(
					`/lists/${listId}/members/${hash}`,
					"GET",
				);
			} else if (operation === "getAll") {
				const count = limit ? Number(limit) : 100;
				const qs = `?count=${count}&sort_field=last_changed&sort_dir=DESC`;
				result = await mailchimpRequest(`/lists/${listId}/members${qs}`, "GET");
			} else if (operation === "update") {
				if (!email) return { success: false, message: "Email is required" };
				const hash = emailToHash(email);

				const body: Record<string, unknown> = {};
				if (status) body.status = status;

				const mergeFieldsParsed = parseJson(mergeFields, "mergeFields");
				if (mergeFieldsParsed) body.merge_fields = mergeFieldsParsed;

				if (Object.keys(body).length > 0) {
					result = await mailchimpRequest(
						`/lists/${listId}/members/${hash}`,
						"PATCH",
						body,
					);
				} else {
					result = await mailchimpRequest(
						`/lists/${listId}/members/${hash}`,
						"GET",
					);
				}

				if (tags) {
					const tagList = tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean);
					if (tagList.length > 0) {
						await mailchimpRequest(
							`/lists/${listId}/members/${hash}/tags`,
							"POST",
							{ tags: tagList.map((name) => ({ name, status: "active" })) },
						);
					}
				}
			} else if (operation === "archive") {
				if (!email) return { success: false, message: "Email is required" };
				const hash = emailToHash(email);
				result = await mailchimpRequest(
					`/lists/${listId}/members/${hash}`,
					"DELETE",
				);
			} else {
				return {
					success: false,
					message: `Unsupported member operation: ${operation}`,
				};
			}
		} else if (resource === "campaign") {
			const operation = params.campaignOperation?.value as string;
			if (!operation)
				return { success: false, message: "Campaign operation is required" };

			if (operation === "create") {
				if (!campaignName)
					return { success: false, message: "Campaign Name is required" };
				if (!subject) return { success: false, message: "Subject is required" };
				if (!fromName)
					return { success: false, message: "From Name is required" };
				if (!replyTo)
					return { success: false, message: "Reply-To Email is required" };

				const body: Record<string, unknown> = {
					type: "regular",
					settings: {
						title: campaignName,
						subject_line: subject,
						from_name: fromName,
						reply_to: replyTo,
					},
				};

				if (campaignListId) {
					body.recipients = { list_id: campaignListId };
				}

				result = await mailchimpRequest("/campaigns", "POST", body);
			} else if (operation === "get") {
				if (!campaignId)
					return { success: false, message: "Campaign ID is required" };
				result = await mailchimpRequest(`/campaigns/${campaignId}`, "GET");
			} else if (operation === "getAll") {
				const count = limit ? Number(limit) : 10;
				result = await mailchimpRequest(`/campaigns?count=${count}`, "GET");
			} else if (operation === "send") {
				if (!campaignId)
					return { success: false, message: "Campaign ID is required" };
				result = await mailchimpRequest(
					`/campaigns/${campaignId}/actions/send`,
					"POST",
				);
			} else if (operation === "delete") {
				if (!campaignId)
					return { success: false, message: "Campaign ID is required" };
				result = await mailchimpRequest(`/campaigns/${campaignId}`, "DELETE");
			} else {
				return {
					success: false,
					message: `Unsupported campaign operation: ${operation}`,
				};
			}
		} else if (resource === "list") {
			const operation = params.listOperation?.value as string;
			if (!operation)
				return { success: false, message: "List operation is required" };

			if (operation === "getAll") {
				const count = limit ? Number(limit) : 100;
				result = await mailchimpRequest(`/lists?count=${count}`, "GET");
			} else if (operation === "get") {
				if (!listId) return { success: false, message: "List ID is required" };
				result = await mailchimpRequest(`/lists/${listId}`, "GET");
			} else {
				return {
					success: false,
					message: `Unsupported list operation: ${operation}`,
				};
			}
		} else {
			return { success: false, message: `Unsupported resource: ${resource}` };
		}

		return { success: true, output: result, status: "completed" };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Mailchimp node",
		};
	}
};
