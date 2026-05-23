import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

export const aiNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.ai"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Provider"),
				name: z.literal("provider"),
				type: z.literal("dropdown"),
				value: z.string(),
				default: z.literal("openai").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "OpenAI", value: "openai" },
						{ label: "OpenRouter", value: "openrouter" },
						{ label: "DeepSeek", value: "deepseek" },
						{ label: "Anthropic", value: "anthropic" },
						{ label: "Gemini", value: "gemini" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Model"),
				name: z.literal("model"),
				type: z.literal("input"),
				value: z.string(),
				default: z.literal("gpt-4o").optional(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z
					.literal("Use hyphens (e.g. gpt-4o, gemini-2.5-flash-lite, claude-sonnet-4-20250514)")
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Prompt"),
				name: z.literal("prompt"),
				type: z.literal("textarea"),
				value: z.string(),
				required: z.boolean(),
				placeholder: z.string().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Max Tokens"),
				name: z.literal("maxTokens"),
				type: z.literal("number"),
				value: z.string(),
				default: z.literal("1000").optional(),
				required: z.boolean(),
				description: z.string().optional(),
			}),
		]),
	),
});
