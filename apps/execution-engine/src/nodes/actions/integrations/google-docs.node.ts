import type { GoogleDocsNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleGoogleAPIResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const googleDocsNodeExecutor = async (
	node: GoogleDocsNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Google Docs node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for Google Docs",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation)
			throw new Error("google docs node operation is invalid");

		const authHeaders = {
			Authorization: `Bearer ${credential.accessToken}`,
		};
		const jsonHeaders = {
			...authHeaders,
			"Content-Type": "application/json",
		};

		if (operation === "create_document") {
			const title = params.title?.value as string;
			if (!title) {
				return { success: false, message: "Title is required" };
			}

			const response = await fetch(
				"https://docs.googleapis.com/v1/documents",
				{
					method: "POST",
					headers: jsonHeaders,
					body: JSON.stringify({ title }),
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "get_document") {
			const documentId = params.documentId?.value as string;
			if (!documentId) {
				return { success: false, message: "Document ID is required" };
			}

			const response = await fetch(
				`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`,
				{
					headers: authHeaders,
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "append_text") {
			const documentId = params.documentId?.value as string;
			const text = params.text?.value as string;

			if (!documentId) {
				return { success: false, message: "Document ID is required" };
			}
			if (!text) {
				return { success: false, message: "Text is required" };
			}

			const response = await fetch(
				`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
				{
					method: "POST",
					headers: jsonHeaders,
					body: JSON.stringify({
						requests: [
							{
								insertText: {
									location: {
										index: -1,
									},
									text,
								},
							},
						],
					}),
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "replace_text") {
			const documentId = params.documentId?.value as string;
			const findText = params.findText?.value as string;
			const replaceText = params.replaceText?.value as string;

			if (!documentId) {
				return { success: false, message: "Document ID is required" };
			}
			if (!findText) {
				return { success: false, message: "Find text is required" };
			}
			if (replaceText === undefined || replaceText === null) {
				return {
					success: false,
					message: "Replace text is required",
				};
			}

			const response = await fetch(
				`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
				{
					method: "POST",
					headers: jsonHeaders,
					body: JSON.stringify({
						requests: [
							{
								replaceAllText: {
									containsText: {
										text: findText,
										matchCase: true,
									},
									replaceText,
								},
							},
						],
					}),
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "delete_document") {
			const documentId = params.documentId?.value as string;
			if (!documentId) {
				return { success: false, message: "Document ID is required" };
			}

			const response = await fetch(
				`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}`,
				{
					method: "DELETE",
					headers: authHeaders,
				},
			);

			if (!response.ok) {
				const data = (await response.json().catch(() => ({}))) as Record<
					string,
					unknown
				>;
				const errorData = data.error as
					| { message?: string }
					| undefined;
				return {
					success: false,
					message:
						errorData?.message ||
						`Failed to delete document (${response.status})`,
				};
			}

			return { success: true, message: "Document deleted" };
		}

		if (operation === "search_documents") {
			const query = params.query?.value as string;
			const pageSize = (params.pageSize?.value as string) || "10";

			const searchQuery = query
				? `name contains '${query}' and mimeType='application/vnd.google-apps.document'`
				: `mimeType='application/vnd.google-apps.document'`;

			const url = new URL(
				"https://www.googleapis.com/drive/v3/files",
			);
			url.searchParams.set("q", searchQuery);
			url.searchParams.set("pageSize", pageSize);
			url.searchParams.set(
				"fields",
				"files(id,name,mimeType,createdTime,modifiedTime)",
			);

			const response = await fetch(url.toString(), {
				headers: authHeaders,
			});

			return handleGoogleAPIResponse(response);
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Google Docs node",
		};
	}
};
