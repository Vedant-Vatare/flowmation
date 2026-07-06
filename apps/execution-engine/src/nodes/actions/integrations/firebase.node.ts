import type { FirebaseNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const parseFirebaseError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		if (body.error) return `Firebase error: ${body.error}`;
		return `Firebase error: ${JSON.stringify(body)}`;
	} catch {
		return `Firebase error: HTTP ${res.status}`;
	}
};

export const firebaseNodeExecutor = async (
	node: FirebaseNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Firebase node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("firebase node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for Firebase",
			};
		}

		const projectId = credential.fields.apiKey as string;
		const authToken = credential.fields.token as string;

		if (!authToken) {
			return {
				success: false,
				message: "Firebase auth token is missing from credential",
			};
		}

		const path = params.path?.value as string;
		if (!path) {
			return { success: false, message: "Path is required" };
		}

		const cleanPath = path.startsWith("/") ? path.slice(1) : path;
		const baseUrl = `https://${projectId}.firebaseio.com/${cleanPath}.json`;

		const url = new URL(baseUrl);
		url.searchParams.set("auth", authToken);

		if (operation === "read_data") {
			const response = await fetch(url.toString(), { method: "GET" });

			if (response.status === 404) {
				return {
					success: false,
					message: `Firebase error: Path not found (${path})`,
				};
			}

			if (!response.ok) {
				return { success: false, message: await parseFirebaseError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Firebase response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "write_data") {
			const dataStr = params.data?.value as string;
			if (!dataStr) {
				return { success: false, message: "Data is required" };
			}

			let parsedData: unknown;
			try {
				parsedData = JSON.parse(dataStr);
			} catch {
				return { success: false, message: "Invalid JSON data" };
			}

			const response = await fetch(url.toString(), {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(parsedData),
			});

			if (!response.ok) {
				return { success: false, message: await parseFirebaseError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Firebase response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "push_data") {
			const dataStr = params.data?.value as string;
			if (!dataStr) {
				return { success: false, message: "Data is required" };
			}

			let parsedData: unknown;
			try {
				parsedData = JSON.parse(dataStr);
			} catch {
				return { success: false, message: "Invalid JSON data" };
			}

			const response = await fetch(url.toString(), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(parsedData),
			});

			if (!response.ok) {
				return { success: false, message: await parseFirebaseError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Firebase response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "update_data") {
			const dataStr = params.data?.value as string;
			if (!dataStr) {
				return { success: false, message: "Data is required" };
			}

			let parsedData: unknown;
			try {
				parsedData = JSON.parse(dataStr);
			} catch {
				return { success: false, message: "Invalid JSON data" };
			}

			const response = await fetch(url.toString(), {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(parsedData),
			});

			if (!response.ok) {
				return { success: false, message: await parseFirebaseError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				return {
					success: false,
					message: "Failed to parse Firebase response",
				};
			}
			return { success: true, output: data, status: "completed" };
		}

		if (operation === "delete_data") {
			const response = await fetch(url.toString(), { method: "DELETE" });

			if (!response.ok) {
				return { success: false, message: await parseFirebaseError(response) };
			}

			let data: unknown;
			try {
				data = await response.json();
			} catch {
				data = null;
			}
			return { success: true, output: data, status: "completed" };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Firebase node",
		};
	}
};
