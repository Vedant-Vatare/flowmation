import type { GoogleSheetsNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleGoogleAPIResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const parseValues = (raw: string): string[][] => {
	return raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.split(",").map((cell) => cell.trim()));
};

export const googleSheetsNodeExecutor = async (
	node: GoogleSheetsNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Google Sheets node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for Google Sheets",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation)
			throw new UnrecoverableError("google sheets node operation is invalid");

		const spreadsheetId = params.spreadsheetId?.value as string;
		const range = params.range?.value as string;

		if (!spreadsheetId || !range) {
			return {
				success: false,
				message: "Spreadsheet ID and Range are required",
			};
		}

		const baseUrl = "https://sheets.googleapis.com/v4/spreadsheets";

		if (operation === "get_values") {
			const url = `${baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}`;

			const response = await fetch(url, {
				headers: { Authorization: `Bearer ${credential.accessToken}` },
			});

			return handleGoogleAPIResponse(response);
		}

		if (operation === "update_values") {
			const rawValues = params.values?.value as string;
			const valueInputOption =
				(params.valueInputOption?.value as string) || "USER_ENTERED";

			if (!rawValues) {
				return {
					success: false,
					message: "Values are required for update operation",
				};
			}

			const values = parseValues(rawValues);
			const url = `${baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`;

			const response = await fetch(url, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${credential.accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ values }),
			});

			return handleGoogleAPIResponse(response);
		}

		if (operation === "append_values") {
			const rawValues = params.values?.value as string;
			const valueInputOption =
				(params.valueInputOption?.value as string) || "USER_ENTERED";

			if (!rawValues) {
				return {
					success: false,
					message: "Values are required for append operation",
				};
			}

			const values = parseValues(rawValues);
			const url = `${baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}`;

			const response = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${credential.accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ values }),
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
					: "Something went wrong in Google Sheets node",
		};
	}
};
