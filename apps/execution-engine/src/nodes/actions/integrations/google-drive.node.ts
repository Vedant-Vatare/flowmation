import type { GoogleDriveNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleGoogleAPIResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const googleDriveNodeExecutor = async (
	node: GoogleDriveNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Google Drive node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for Google Drive",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation)
			throw new Error("google drive node operation is invalid");

		const authHeaders = {
			Authorization: `Bearer ${credential.accessToken}`,
		};
		const jsonHeaders = {
			...authHeaders,
			"Content-Type": "application/json",
		};

		if (operation === "list_files") {
			const url = new URL(
				"https://www.googleapis.com/drive/v3/files",
			);
			const query = params.query?.value as string | undefined;
			const pageSize = (params.pageSize?.value as string) || "10";

			url.searchParams.set("pageSize", pageSize);
			if (query) url.searchParams.set("q", query);

			const response = await fetch(url.toString(), {
				headers: authHeaders,
			});

			return handleGoogleAPIResponse(response);
		}

		if (operation === "get_file") {
			const fileId = params.fileId?.value as string;
			if (!fileId) {
				return { success: false, message: "File ID is required" };
			}

			const url = new URL(
				`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
			);
			url.searchParams.set("fields", "*");

			const response = await fetch(url.toString(), {
				headers: authHeaders,
			});

			return handleGoogleAPIResponse(response);
		}

		if (operation === "upload_file") {
			const fileName = params.fileName?.value as string;
			const fileContent = params.fileContent?.value as string;
			const mimeType =
				(params.mimeType?.value as string) || "text/plain";
			const parentFolderId = params.parentFolderId?.value as
				| string
				| undefined;

			if (!fileName) {
				return {
					success: false,
					message: "File name is required for upload",
				};
			}

			const metadata: Record<string, unknown> = {
				name: fileName,
				mimeType,
			};
			if (parentFolderId) {
				metadata.parents = [parentFolderId];
			}

			if (fileContent) {
				const boundary = "drive_upload_boundary_flowmation";
				const delimiter = `\r\n--${boundary}\r\n`;
				const closeDelimiter = `\r\n--${boundary}--`;
				const bodyParts = [
					`Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
					`Content-Type: ${mimeType}\r\n\r\n${fileContent}`,
				];
				const body =
					delimiter +
					bodyParts.join(delimiter) +
					closeDelimiter;

				const response = await fetch(
					"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
					{
						method: "POST",
						headers: {
							...authHeaders,
							"Content-Type": `multipart/related; boundary=${boundary}`,
						},
						body,
					},
				);

				return handleGoogleAPIResponse(response);
			}

			const response = await fetch(
				"https://www.googleapis.com/drive/v3/files",
				{
					method: "POST",
					headers: jsonHeaders,
					body: JSON.stringify(metadata),
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "update_file") {
			const fileId = params.fileId?.value as string;
			if (!fileId) {
				return { success: false, message: "File ID is required" };
			}

			const newFileName = params.fileName?.value as string | undefined;
			const newContent = params.fileContent?.value as string | undefined;
			const newMimeType =
				(params.mimeType?.value as string | undefined) || undefined;

			const hasMetadata = !!(newFileName || newMimeType);
			const hasContent = !!newContent;

			if (!hasMetadata && !hasContent) {
				return {
					success: false,
					message: "Provide a new file name, content, or both to update",
				};
			}

			const metadata: Record<string, unknown> = {};
			if (newFileName) metadata.name = newFileName;
			if (newMimeType) metadata.mimeType = newMimeType;

			if (hasContent && hasMetadata) {
				const boundary = "drive_update_boundary_flowmation";
				const delimiter = `\r\n--${boundary}\r\n`;
				const closeDelimiter = `\r\n--${boundary}--`;
				const bodyParts = [
					`Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
					`Content-Type: ${newMimeType || "text/plain"}\r\n\r\n${newContent}`,
				];
				const body =
					delimiter +
					bodyParts.join(delimiter) +
					closeDelimiter;

				const response = await fetch(
					`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart`,
					{
						method: "PATCH",
						headers: {
							...authHeaders,
							"Content-Type": `multipart/related; boundary=${boundary}`,
						},
						body,
					},
				);

				return handleGoogleAPIResponse(response);
			}

			if (hasContent) {
				const response = await fetch(
					`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
					{
						method: "PATCH",
						headers: {
							...authHeaders,
							"Content-Type": newMimeType || "text/plain",
						},
						body: newContent,
					},
				);

				return handleGoogleAPIResponse(response);
			}

			const response = await fetch(
				`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
				{
					method: "PATCH",
					headers: jsonHeaders,
					body: JSON.stringify(metadata),
				},
			);

			return handleGoogleAPIResponse(response);
		}

		if (operation === "delete_file") {
			const fileId = params.fileId?.value as string;
			if (!fileId) {
				return { success: false, message: "File ID is required" };
			}

			const response = await fetch(
				`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
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
						`Failed to delete file (${response.status})`,
				};
			}

			return { success: true, message: "File deleted" };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Google Drive node",
		};
	}
};
