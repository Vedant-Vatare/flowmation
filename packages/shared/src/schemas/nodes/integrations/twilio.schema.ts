import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const twilioNodeValueSchemas = {
	operation: withExpr(z.string()),
	to: withExpr(z.string()),
	from: withExpr(z.string()),
	body: withExpr(z.string()),
	messageSid: withExpr(z.string()),
	twiml: withExpr(z.string()),
	maxRecords: withExpr(z.string()),
} as const;

export const twilioNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.twilio"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: twilioNodeValueSchemas.operation,
				default: z.literal("send_sms").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Send SMS", value: "send_sms" },
						{ label: "Send WhatsApp", value: "send_whatsapp" },
						{ label: "Get Message", value: "get_message" },
						{ label: "List Messages", value: "list_messages" },
						{ label: "Make Call", value: "make_call" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("To"),
				name: z.literal("to"),
				type: z.literal("input"),
				value: twilioNodeValueSchemas.to,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("send_sms"),
									z.literal("send_whatsapp"),
									z.literal("make_call"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("From"),
				name: z.literal("from"),
				type: z.literal("input"),
				value: twilioNodeValueSchemas.from,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("send_sms"),
									z.literal("send_whatsapp"),
									z.literal("make_call"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Message Body"),
				name: z.literal("body"),
				type: z.literal("textarea"),
				value: twilioNodeValueSchemas.body,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([z.literal("send_sms"), z.literal("send_whatsapp")]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Message SID"),
				name: z.literal("messageSid"),
				type: z.literal("input"),
				value: twilioNodeValueSchemas.messageSid,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("get_message")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("TwiML"),
				name: z.literal("twiml"),
				type: z.literal("textarea"),
				value: twilioNodeValueSchemas.twiml,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("make_call")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Max Records"),
				name: z.literal("maxRecords"),
				type: z.literal("input"),
				value: twilioNodeValueSchemas.maxRecords,
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_messages")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
