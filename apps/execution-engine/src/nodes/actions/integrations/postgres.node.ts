import type { PostgresNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const postgresNodeExecutor = async (
	node: PostgresNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for PostgreSQL node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (
			credential.type !== "database" ||
			!credential.fields?.connectionString
		) {
			return {
				success: false,
				message: "Invalid credential format for PostgreSQL",
			};
		}

		const connectionString = credential.fields.connectionString;

		const params = await getResolvedParams(node, executionId);
		const query = params.query?.value as string;

		if (!query) {
			return { success: false, message: "Query is required" };
		}

		const parametersStr = params.parameters?.value as string;
		let queryParams: unknown[] | undefined;

		if (parametersStr?.trim()) {
			queryParams = parametersStr.split(",").map((p) => p.trim());
		}

		const { Client } = await import("pg");
		const client = new Client({ connectionString });

		await client.connect();

		try {
			const result = queryParams
				? await client.query(query, queryParams)
				: await client.query(query);
			return { success: true, output: result, status: "completed" };
		} finally {
			await client.end();
		}
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in PostgreSQL node",
		};
	}
};
