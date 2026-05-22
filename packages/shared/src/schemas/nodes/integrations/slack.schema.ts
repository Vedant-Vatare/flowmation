import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

export const slackNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.slack"),
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
						{ label: "Invite to Channel", value: "invite_to_channel" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Channel"),
				name: z.literal("channel"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				description: z.literal("Channel ID ").optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("send_message"),
									z.literal("invite_to_channel"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Message"),
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
				label: z.literal("User IDs"),
				name: z.literal("users"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				description: z
					.literal("Comma-separated Slack user IDs to invite")
					.optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("invite_to_channel")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
