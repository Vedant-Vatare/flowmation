import type { SupabaseNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const parseSupabaseError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		if (body.message) return `Supabase error: ${body.message}`;
		return `Supabase error: ${JSON.stringify(body)}`;
	} catch {
		return `Supabase error: HTTP ${res.status}`;
	}
};

export const supabaseNodeExecutor = async (
	node: SupabaseNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Supabase node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("supabase node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Supabase",
			};
		}

		const projectRef = credential.fields.projectRef as string;
		const apiKey = credential.fields.apiKey as string;

		if (!projectRef) {
			return {
				success: false,
				message: "Project reference is missing from credential",
			};
		}

		const baseUrl = `https://${projectRef}.supabase.co`;

		const headers: Record<string, string> = {
			apikey: apiKey,
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		};

		if (operation === "query_rows") {
			const table = params.table?.value as string;
			if (!table) return { success: false, message: "Table name is required" };

			const url = new URL(`${baseUrl}/rest/v1/${table}`);

			const selectColumns = params.selectColumns?.value as string;
			if (selectColumns) url.searchParams.set("select", selectColumns);

			const filter = params.filter?.value as string;
			if (filter) {
				const filterParts = filter.split("&");
				for (const part of filterParts) {
					const [key, value] = part.split("=");
					if (key && value) url.searchParams.set(key, value);
				}
			}

			const orderBy = params.orderBy?.value as string;
			if (orderBy) url.searchParams.set("order", orderBy);

			const limit = params.limit?.value as string;
			if (limit) url.searchParams.set("limit", limit);

			const offset = params.offset?.value as string;
			if (offset) url.searchParams.set("offset", offset);

			const response = await fetch(url.toString(), { method: "GET", headers });

			if (!response.ok) {
				return { success: false, message: await parseSupabaseError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Supabase response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "insert_rows") {
			const table = params.table?.value as string;
			const dataStr = params.data?.value as string;
			if (!table) return { success: false, message: "Table name is required" };
			if (!dataStr) return { success: false, message: "Data is required" };

			let parsedData: unknown;
			try {
				parsedData = JSON.parse(dataStr);
			} catch {
				return { success: false, message: "Invalid JSON data" };
			}

			const response = await fetch(`${baseUrl}/rest/v1/${table}`, {
				method: "POST",
				headers: {
					...headers,
					Prefer: "return=representation",
				},
				body: JSON.stringify(parsedData),
			});

			if (!response.ok) {
				return { success: false, message: await parseSupabaseError(response) };
			}

			let result: unknown;
			try {
				result = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Supabase response",
				};
			}
			return { success: true, output: result, status: "completed" };
		}

		if (operation === "update_rows") {
			const table = params.table?.value as string;
			const dataStr = params.data?.value as string;
			const filter = params.filter?.value as string;
			if (!table) return { success: false, message: "Table name is required" };
			if (!dataStr) return { success: false, message: "Data is required" };
			if (!filter) return { success: false, message: "Filter is required for update" };

			let parsedData: unknown;
			try {
				parsedData = JSON.parse(dataStr);
			} catch {
				return { success: false, message: "Invalid JSON data" };
			}

			const url = new URL(`${baseUrl}/rest/v1/${table}`);
			const filterParts = filter.split("&");
			for (const part of filterParts) {
				const [key, value] = part.split("=");
				if (key && value) url.searchParams.set(key, value);
			}

			const response = await fetch(url.toString(), {
				method: "PATCH",
				headers: {
					...headers,
					Prefer: "return=representation",
				},
				body: JSON.stringify(parsedData),
			});

			if (!response.ok) {
				return { success: false, message: await parseSupabaseError(response) };
			}

			let result: unknown;
			try {
				result = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Supabase response",
				};
			}
			return { success: true, output: result, status: "completed" };
		}

		if (operation === "delete_rows") {
			const table = params.table?.value as string;
			const filter = params.filter?.value as string;
			if (!table) return { success: false, message: "Table name is required" };
			if (!filter) return { success: false, message: "Filter is required for delete" };

			const url = new URL(`${baseUrl}/rest/v1/${table}`);
			const filterParts = filter.split("&");
			for (const part of filterParts) {
				const [key, value] = part.split("=");
				if (key && value) url.searchParams.set(key, value);
			}

			const response = await fetch(url.toString(), {
				method: "DELETE",
				headers: {
					...headers,
					Prefer: "return=representation",
				},
			});

			if (!response.ok) {
				return { success: false, message: await parseSupabaseError(response) };
			}

			let result: unknown;
			try {
				result = await response.json();
			} catch {
				result = null;
			}
			return { success: true, output: result, status: "completed" };
		}

		if (operation === "upsert_rows") {
			const table = params.table?.value as string;
			const dataStr = params.data?.value as string;
			if (!table) return { success: false, message: "Table name is required" };
			if (!dataStr) return { success: false, message: "Data is required" };

			let parsedData: unknown;
			try {
				parsedData = JSON.parse(dataStr);
			} catch {
				return { success: false, message: "Invalid JSON data" };
			}

			const response = await fetch(`${baseUrl}/rest/v1/${table}`, {
				method: "POST",
				headers: {
					...headers,
					Prefer: "return=representation,resolution=merge-duplicates",
				},
				body: JSON.stringify(parsedData),
			});

			if (!response.ok) {
				return { success: false, message: await parseSupabaseError(response) };
			}

			let result: unknown;
			try {
				result = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Supabase response",
				};
			}
			return { success: true, output: result, status: "completed" };
		}

		if (operation === "invoke_function") {
			const functionName = params.functionName?.value as string;
			if (!functionName)
				return { success: false, message: "Function name is required" };

			const functionBodyStr = params.functionBody?.value as string;
			let body: string | undefined;
			if (functionBodyStr) {
				try {
					JSON.parse(functionBodyStr);
					body = functionBodyStr;
				} catch {
					return { success: false, message: "Invalid JSON function body" };
				}
			}

			const response = await fetch(
				`${baseUrl}/functions/v1/${functionName}`,
				{
					method: "POST",
					headers,
					body: body ?? undefined,
				},
			);

			if (!response.ok) {
				return { success: false, message: await parseSupabaseError(response) };
			}

			let result: unknown;
			try {
				result = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Supabase response",
				};
			}
			return { success: true, output: result, status: "completed" };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Supabase node",
		};
	}
};
