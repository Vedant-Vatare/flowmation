import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

export const telegramNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.telegram"),
	type: z.literal("action"),
	credentialId: z.string().nullable().optional(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: z.string(),
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
				value: z.string(),
				required: z.boolean(),
				description: z.string().optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Message Text"),
				name: z.literal("text"),
				type: z.literal("textarea"),
				value: z.string(),
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
				value: z.string(),
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
				value: z.string(),
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
				value: z.string(),
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
				value: z.string(),
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
