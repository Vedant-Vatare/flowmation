import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

export const gmailNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.gmail"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: z.string(),
				default: z.literal("send_email").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Send Email", value: "send_email" },
						{ label: "Create Draft", value: "create_draft" },
						{ label: "Send Draft", value: "send_draft" },
						{ label: "Search Emails", value: "search_emails" },
						{ label: "Add Label", value: "add_label" },
						{ label: "Remove Label", value: "remove_label" },
						{ label: "Mark as Read/Unread", value: "mark_read_unread" },
						{ label: "Reply to Email", value: "reply_to_email" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("To"),
				name: z.literal("to"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["send_email", "create_draft", "reply_to_email"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Subject"),
				name: z.literal("subject"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["send_email", "create_draft", "reply_to_email"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Body"),
				name: z.literal("body"),
				type: z.literal("textarea"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["send_email", "create_draft", "reply_to_email"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Draft ID"),
				name: z.literal("draftId"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("send_draft")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Search Query"),
				name: z.literal("query"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				description: z
					.literal("e.g. is:unread from:user@example.com")
					.optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("search_emails")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Max Results"),
				name: z.literal("maxResults"),
				type: z.literal("number"),
				value: z.string(),
				default: z.literal("10").optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("search_emails")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Message ID"),
				name: z.literal("messageId"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum([
									"add_label",
									"remove_label",
									"mark_read_unread",
									"reply_to_email",
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Label IDs"),
				name: z.literal("labelIds"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				description: z
					.literal("Comma-separated label IDs (e.g. INBOX, SPAM)")
					.optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["add_label", "remove_label"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Read Status"),
				name: z.literal("readStatus"),
				type: z.literal("dropdown"),
				value: z.string(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Mark as Read", value: "read" },
						{ label: "Mark as Unread", value: "unread" },
					]),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("mark_read_unread")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
