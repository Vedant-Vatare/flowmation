import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const razorpayNodeValueSchemas = {
	operation: withExpr(z.string()),
	amount: withExpr(z.coerce.number().positive()),
	currency: withExpr(z.string()),
	receipt: withExpr(z.string()),
	paymentId: withExpr(z.string()),
	description: withExpr(z.string()),
	customerName: withExpr(z.string()),
	customerEmail: withExpr(z.string()),
	customerContact: withExpr(z.string()),
	notifyEmail: withExpr(z.boolean()),
	notifySms: withExpr(z.boolean()),
	count: withExpr(z.coerce.number().int().min(1).max(100)),
	skip: withExpr(z.coerce.number().int().min(0)),
	fromDate: withExpr(z.string()),
	toDate: withExpr(z.string()),
} as const;

export const razorpayNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.razorpay"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: razorpayNodeValueSchemas.operation,
				default: z.literal("create_order").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Order", value: "create_order" },
						{ label: "Create Payment Link", value: "create_payment_link" },
						{ label: "Fetch Payment", value: "fetch_payment" },
						{ label: "List Payments", value: "list_payments" },
					]),
				required: z.boolean(),
			}),

			// ── Create Order & Create Payment Link shared ──
			nodeParameterSchema.extend({
				label: z.literal("Amount (in paise)"),
				name: z.literal("amount"),
				type: z.literal("number"),
				value: razorpayNodeValueSchemas.amount,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("create_order"),
									z.literal("create_payment_link"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Currency"),
				name: z.literal("currency"),
				type: z.literal("dropdown"),
				value: razorpayNodeValueSchemas.currency,
				default: z.literal("INR").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "INR", value: "INR" },
						{ label: "USD", value: "USD" },
					]),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("create_order"),
									z.literal("create_payment_link"),
								]),
							),
						}),
					)
					.optional(),
			}),

			// ── Create Order specific ──
			nodeParameterSchema.extend({
				label: z.literal("Receipt"),
				name: z.literal("receipt"),
				type: z.literal("input"),
				value: razorpayNodeValueSchemas.receipt,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_order")),
						}),
					)
					.optional(),
			}),

			// ── Create Payment Link specific ──
			nodeParameterSchema.extend({
				label: z.literal("Description"),
				name: z.literal("description"),
				type: z.literal("input"),
				value: razorpayNodeValueSchemas.description,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_payment_link")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Customer Name"),
				name: z.literal("customerName"),
				type: z.literal("input"),
				value: razorpayNodeValueSchemas.customerName,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_payment_link")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Customer Email"),
				name: z.literal("customerEmail"),
				type: z.literal("input"),
				value: razorpayNodeValueSchemas.customerEmail,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_payment_link")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Customer Contact"),
				name: z.literal("customerContact"),
				type: z.literal("input"),
				value: razorpayNodeValueSchemas.customerContact,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_payment_link")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Notify via Email"),
				name: z.literal("notifyEmail"),
				type: z.literal("boolean"),
				value: razorpayNodeValueSchemas.notifyEmail,
				default: z.boolean().default(true),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_payment_link")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Notify via SMS"),
				name: z.literal("notifySms"),
				type: z.literal("boolean"),
				value: razorpayNodeValueSchemas.notifySms,
				default: z.boolean().default(false),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_payment_link")),
						}),
					)
					.optional(),
			}),

			// ── Fetch Payment ──
			nodeParameterSchema.extend({
				label: z.literal("Payment ID"),
				name: z.literal("paymentId"),
				type: z.literal("input"),
				value: razorpayNodeValueSchemas.paymentId,
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("fetch_payment")),
						}),
					)
					.optional(),
			}),

			// ── List Payments ──
			nodeParameterSchema.extend({
				label: z.literal("Count"),
				name: z.literal("count"),
				type: z.literal("number"),
				value: razorpayNodeValueSchemas.count,
				default: z.literal("10").optional(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_payments")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Skip"),
				name: z.literal("skip"),
				type: z.literal("number"),
				value: razorpayNodeValueSchemas.skip,
				default: z.literal("0").optional(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_payments")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("From Date"),
				name: z.literal("fromDate"),
				type: z.literal("date"),
				value: razorpayNodeValueSchemas.fromDate,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_payments")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("To Date"),
				name: z.literal("toDate"),
				type: z.literal("date"),
				value: razorpayNodeValueSchemas.toDate,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_payments")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
