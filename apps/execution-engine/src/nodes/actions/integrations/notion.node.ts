import type { NotionNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const toNotionUUID = (input: string): string => {
	if (
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			input,
		)
	) {
		return input;
	}
	const hexMatch = input.match(/([0-9a-f]{32})/i);
	const hex = hexMatch?.[1];
	if (hex) {
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}
	return input;
};

const buildTitleProperty = (title: string) => ({
	title: {
		title: [{ type: "text" as const, text: { content: title } }],
	},
});

const textToNotionBlocks = (content: string) => {
	const lines = content.split("\n").filter((line) => line.trim() !== "");

	return lines.map((line) => {
		if (line.startsWith("### "))
			return {
				object: "block" as const,
				type: "heading_3" as const,
				heading_3: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(4) } },
					],
				},
			};
		if (line.startsWith("## "))
			return {
				object: "block" as const,
				type: "heading_2" as const,
				heading_2: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(3) } },
					],
				},
			};
		if (line.startsWith("# "))
			return {
				object: "block" as const,
				type: "heading_1" as const,
				heading_1: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(2) } },
					],
				},
			};

		if (line.startsWith("- "))
			return {
				object: "block" as const,
				type: "bulleted_list_item" as const,
				bulleted_list_item: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(2) } },
					],
				},
			};
		if (/^\d+\. /.test(line))
			return {
				object: "block" as const,
				type: "numbered_list_item" as const,
				numbered_list_item: {
					rich_text: [
						{
							type: "text" as const,
							text: { content: line.replace(/^\d+\. /, "") },
						},
					],
				},
			};

		if (line.startsWith("[ ] "))
			return {
				object: "block" as const,
				type: "to_do" as const,
				to_do: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(4) } },
					],
					checked: false,
				},
			};
		if (line.startsWith("[x] ") || line.startsWith("[X] "))
			return {
				object: "block" as const,
				type: "to_do" as const,
				to_do: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(4) } },
					],
					checked: true,
				},
			};

		if (line.startsWith("> "))
			return {
				object: "block" as const,
				type: "quote" as const,
				quote: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(2) } },
					],
				},
			};

		if (line.trim() === "---")
			return {
				object: "block" as const,
				type: "divider" as const,
				divider: {},
			};

		if (line.startsWith("`") && line.endsWith("`") && line.length > 2)
			return {
				object: "block" as const,
				type: "code" as const,
				code: {
					rich_text: [
						{ type: "text" as const, text: { content: line.slice(1, -1) } },
					],
					language: "plain text",
				},
			};

		return {
			object: "block" as const,
			type: "paragraph" as const,
			paragraph: {
				rich_text: [{ type: "text" as const, text: { content: line } }],
			},
		};
	});
};

const mergeProperties = (
	title: string,
	propertiesJson?: string,
): Record<string, unknown> => {
	const base = buildTitleProperty(title);
	if (!propertiesJson) return base;
	try {
		const extra = JSON.parse(propertiesJson);
		return { ...base, ...extra };
	} catch {
		return base;
	}
};

export const notionNodeExecutor = async (
	node: NotionNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Notion node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return {
				success: false,
				message: "Invalid credential format for Notion",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;

		if (!operation)
			throw new UnrecoverableError("Notion node operation is invalid");

		const headers: Record<string, string> = {
			Authorization: `Bearer ${credential.accessToken}`,
			"Content-Type": "application/json",
			"Notion-Version": NOTION_VERSION,
		};

		if (operation === "create_database_row") {
			const databaseId = toNotionUUID(
				(params.databaseId?.value as string) ?? "",
			);
			const title = params.title?.value as string;
			const properties = params.properties?.value as string | undefined;

			if (!databaseId) throw new UnrecoverableError("databaseId is required");
			if (!title) throw new UnrecoverableError("title is required");

			const body = {
				parent: { type: "database_id" as const, database_id: databaseId },
				properties: mergeProperties(title, properties),
			};

			const response = await fetch(`${NOTION_API}/pages`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			return handleResponse(response);
		}

		if (operation === "create_page") {
			const parentPageId = toNotionUUID(
				(params.parentPageId?.value as string) ?? "",
			);
			const title = params.title?.value as string;
			const content = params.content?.value as string | undefined;

			if (!parentPageId)
				throw new UnrecoverableError("parentPageId is required");
			if (!title) throw new UnrecoverableError("title is required");

			const body: Record<string, unknown> = {
				parent: { type: "page_id" as const, page_id: parentPageId },
				properties: buildTitleProperty(title),
			};

			if (content) {
				body.children = textToNotionBlocks(content);
			}

			const response = await fetch(`${NOTION_API}/pages`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			return handleResponse(response);
		}

		if (operation === "append_blocks") {
			const blockId = toNotionUUID((params.pageId?.value as string) ?? "");
			const content = params.content?.value as string | undefined;

			if (!blockId) throw new UnrecoverableError("blockId/pageId is required");

			if (!content) {
				return { success: true, output: { message: "No content to append" } };
			}

			const body = {
				children: textToNotionBlocks(content),
			};

			const response = await fetch(`${NOTION_API}/blocks/${blockId}/children`, {
				method: "PATCH",
				headers,
				body: JSON.stringify(body),
			});

			return handleResponse(response);
		}

		if (operation === "get_page_content") {
			const pageId = toNotionUUID((params.pageId?.value as string) ?? "");

			if (!pageId) throw new UnrecoverableError("pageId is required");

			const response = await fetch(
				`${NOTION_API}/blocks/${pageId}/children?page_size=100`,
				{ headers },
			);

			return handleResponse(response);
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Notion node",
		};
	}
};
