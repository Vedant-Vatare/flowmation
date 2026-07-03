import type { AirtableNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const AIRTABLE_API = "https://api.airtable.com/v0";

export const airtableNodeExecutor = async (
	node: AirtableNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Airtable node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("airtable node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Airtable",
			};
		}

		const apiKey = credential.fields.apiKey as string;
		const baseId = params.baseId?.value as string;
		const tableName = params.tableName?.value as string;

		if (!baseId || !tableName) {
			return { success: false, message: "Base ID and Table Name are required" };
		}

		const headers = {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		};

		if (operation === "list_records") {
			const url = new URL(`${AIRTABLE_API}/${baseId}/${tableName}`);

			const filterByFormula = params.filterByFormula?.value as string;
			if (filterByFormula) {
				url.searchParams.set("filterByFormula", filterByFormula);
			}

			const sort = params.sort?.value as string;
			if (sort) {
				url.searchParams.set("sort[0][field]", sort);
				url.searchParams.set("sort[0][direction]", "asc");
			}

			const maxRecords = params.maxRecords?.value as string;
			if (maxRecords) {
				url.searchParams.set("maxRecords", maxRecords);
			}

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (response.status === 429) {
				return {
					success: false,
					message: "Airtable rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				const error = (await response.json()) as Record<string, unknown>;
				return {
					success: false,
					message: `Airtable error: ${(error as { error: { message: string } }).error?.message ?? "Unknown error"}`,
				};
			}

			const data = await response.json();
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "get_record") {
			const recordId = params.recordId?.value as string;
			if (!recordId) {
				return { success: false, message: "Record ID is required" };
			}

			const response = await fetch(
				`${AIRTABLE_API}/${baseId}/${tableName}/${recordId}`,
				{ method: "GET", headers },
			);

			if (response.status === 429) {
				return {
					success: false,
					message: "Airtable rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				const error = (await response.json()) as Record<string, unknown>;
				return {
					success: false,
					message: `Airtable error: ${(error as { error: { message: string } }).error?.message ?? "Unknown error"}`,
				};
			}

			const data = await response.json();
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "create_record") {
			const fieldsRaw = params.fields?.value as string;
			if (!fieldsRaw) {
				return {
					success: false,
					message: "Fields (JSON) are required",
				};
			}

			let fields: Record<string, unknown>;
			try {
				fields = JSON.parse(fieldsRaw) as Record<string, unknown>;
			} catch {
				return { success: false, message: "Invalid JSON in Fields" };
			}

			const response = await fetch(`${AIRTABLE_API}/${baseId}/${tableName}`, {
				method: "POST",
				headers,
				body: JSON.stringify({ fields }),
			});

			if (response.status === 429) {
				return {
					success: false,
					message: "Airtable rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				const error = (await response.json()) as Record<string, unknown>;
				return {
					success: false,
					message: `Airtable error: ${(error as { error: { message: string } }).error?.message ?? "Unknown error"}`,
				};
			}

			const data = await response.json();
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "update_record") {
			const recordId = params.recordId?.value as string;
			const fieldsRaw = params.fields?.value as string;

			if (!recordId) {
				return { success: false, message: "Record ID is required" };
			}
			if (!fieldsRaw) {
				return { success: false, message: "Fields (JSON) are required" };
			}

			let fields: Record<string, unknown>;
			try {
				fields = JSON.parse(fieldsRaw) as Record<string, unknown>;
			} catch {
				return { success: false, message: "Invalid JSON in Fields" };
			}

			const response = await fetch(
				`${AIRTABLE_API}/${baseId}/${tableName}/${recordId}`,
				{
					method: "PATCH",
					headers,
					body: JSON.stringify({ fields }),
				},
			);

			if (response.status === 429) {
				return {
					success: false,
					message: "Airtable rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				const error = (await response.json()) as Record<string, unknown>;
				return {
					success: false,
					message: `Airtable error: ${(error as { error: { message: string } }).error?.message ?? "Unknown error"}`,
				};
			}

			const data = await response.json();
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "delete_record") {
			const recordId = params.recordId?.value as string;
			if (!recordId) {
				return { success: false, message: "Record ID is required" };
			}

			const response = await fetch(
				`${AIRTABLE_API}/${baseId}/${tableName}/${recordId}`,
				{ method: "DELETE", headers },
			);

			if (response.status === 429) {
				return {
					success: false,
					message: "Airtable rate limit exceeded. Please retry after a moment.",
				};
			}

			if (!response.ok) {
				const error = (await response.json()) as Record<string, unknown>;
				return {
					success: false,
					message: `Airtable error: ${(error as { error: { message: string } }).error?.message ?? "Unknown error"}`,
				};
			}

			const data = await response.json();
			return { success: true, output: data, status: "completed" };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Airtable node",
		};
	}
};
