import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const telegramNodeValueSchemas = {
	operation: withExpr(z.string()),
	chatId: withExpr(z.string()),
	text: withExpr(z.string()),
	parseMode: withExpr(z.string()),
	photo: withExpr(z.string()),
	caption: withExpr(z.string()),
	document: withExpr(z.string()),
} as const;

export const telegramNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.telegram"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: telegramNodeValueSchemas.operation,
				default: z.literal("send_message").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Send Message", value: "send_message" },
						{ label: "Send Photo", value: "send_photo" },
						{ label: "Send Document", value: "send_document" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Chat ID"),
				name: z.literal("chatId"),
				type: z.literal("input"),
				value: telegramNodeValueSchemas.chatId,
				required: z.boolean(),
				description: z.string().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Message Text"),
				name: z.literal("text"),
				type: z.literal("textarea"),
				value: telegramNodeValueSchemas.text,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("send_message")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Parse Mode"),
				name: z.literal("parseMode"),
				type: z.literal("dropdown"),
				value: telegramNodeValueSchemas.parseMode,
				default: z.literal("none").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "None", value: "none" },
						{ label: "Markdown", value: "Markdown" },
						{ label: "HTML", value: "HTML" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("send_message")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Photo URL"),
				name: z.literal("photo"),
				type: z.literal("input"),
				value: telegramNodeValueSchemas.photo,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("send_photo")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Caption"),
				name: z.literal("caption"),
				type: z.literal("textarea"),
				value: telegramNodeValueSchemas.caption,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("send_photo"), z.literal("send_document")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Document URL"),
				name: z.literal("document"),
				type: z.literal("input"),
				value: telegramNodeValueSchemas.document,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("send_document")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
