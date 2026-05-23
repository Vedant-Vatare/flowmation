import type { AiNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const PROVIDER_CONFIG: Record<
	string,
	{
		baseUrl: string;
		headers: (apiKey: string) => Record<string, string>;
		buildBody: (params: {
			model: string;
			prompt: string;
			temperature: number;
			maxTokens: number;
		}) => Record<string, unknown>;
		extractContent: (data: Record<string, unknown>) => string;
	}
> = {
	openai: {
		baseUrl: "https://api.openai.com/v1/chat/completions",
		headers: (apiKey) => ({
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		}),
		buildBody: ({ model, prompt, temperature, maxTokens }) => ({
			model,
			messages: [{ role: "user", content: prompt }],
			temperature,
			max_tokens: maxTokens,
		}),
		extractContent: (data) =>
			(data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message
				?.content || "",
	},
	openrouter: {
		baseUrl: "https://openrouter.ai/api/v1/chat/completions",
		headers: (apiKey) => ({
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		}),
		buildBody: ({ model, prompt, temperature, maxTokens }) => ({
			model,
			messages: [{ role: "user", content: prompt }],
			temperature,
			max_tokens: maxTokens,
		}),
		extractContent: (data) =>
			(data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message
				?.content || "",
	},
	deepseek: {
		baseUrl: "https://api.deepseek.com/v1/chat/completions",
		headers: (apiKey) => ({
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		}),
		buildBody: ({ model, prompt, temperature, maxTokens }) => ({
			model,
			messages: [{ role: "user", content: prompt }],
			temperature,
			max_tokens: maxTokens,
		}),
		extractContent: (data) =>
			(data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message
				?.content || "",
	},
	anthropic: {
		baseUrl: "https://api.anthropic.com/v1/messages",
		headers: (apiKey) => ({
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"Content-Type": "application/json",
		}),
		buildBody: ({ model, prompt, temperature, maxTokens }) => ({
			model,
			max_tokens: maxTokens,
			temperature,
			messages: [{ role: "user", content: prompt }],
		}),
		extractContent: (data) =>
			(
				data.content as Array<{ type?: string; text?: string }>
			)?.[0]?.text || "",
	},
	gemini: {
		baseUrl: "",
		headers: () => ({ "Content-Type": "application/json" }),
		buildBody: ({ model: _model, prompt, temperature, maxTokens }) => ({
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: {
				temperature,
				maxOutputTokens: maxTokens,
			},
		}),
		extractContent: (data) =>
			(
				data.candidates as Array<{
					content?: { parts?: Array<{ text?: string }> };
				}>
			)?.[0]?.content?.parts?.[0]?.text || "",
	},
};

export const aiNodeExecutor = async (
	node: AiNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for AI node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.apiKey) {
			return {
				success: false,
				message: "Invalid credential format for AI node",
			};
		}

		const params = await getResolvedParams(node, executionId);
		const provider = params.provider?.value as string;
		const model = (params.model?.value as string)
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "-");
		const prompt = params.prompt?.value as string;
		const maxTokens = parseInt(
			(params.maxTokens?.value as string) || "1000",
			10,
		);

		if (!provider || !model || !prompt) {
			return {
				success: false,
				message: "Provider, Model, and Prompt are required",
			};
		}

		const config = PROVIDER_CONFIG[provider];
		if (!config) {
			return { success: false, message: `Unsupported provider: ${provider}` };
		}

		const apiKey = credential.fields.apiKey as string;

		let url: string;
		let body: Record<string, unknown>;

		if (provider === "gemini") {
			url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
			body = config.buildBody({ model, prompt, temperature: 0.7, maxTokens });
		} else {
			url = config.baseUrl;
			body = config.buildBody({ model, prompt, temperature: 0.7, maxTokens });
		}

		const response = await fetch(url, {
			method: "POST",
			headers: config.headers(apiKey),
			body: JSON.stringify(body),
		});

		const data = (await response.json()) as Record<string, unknown>;

		if (!response.ok) {
			const errorMessage =
				(data.error as { message?: string })?.message ||
				`API returned ${response.status}`;
			return { success: false, message: errorMessage, output: data };
		}

		const content = config.extractContent(data);

		return {
			success: true,
			output: {
				content,
				model,
				provider,
				raw: data,
			},
		};
	} catch (err) {
		if (err instanceof UnrecoverableError) throw err;
		return {
			success: false,
			message:
				err instanceof Error ? err.message : "Something went wrong in AI node",
		};
	}
};
