import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const calcomNodeValueSchemas = {
	operation: withExpr(z.string()),
	eventTypeId: withExpr(z.coerce.number().int().positive()),
	startTime: withExpr(z.string()),
	attendeeName: withExpr(z.string()),
	attendeeEmail: withExpr(z.string()),
	bookingUid: withExpr(z.string().regex(/^(?!\d+$).+/, "Invalid Booking UID")),
	reason: withExpr(z.string()),
	status: withExpr(z.string()),
	limit: withExpr(z.coerce.number().int().min(1)),
	startDate: withExpr(z.string()),
	endDate: withExpr(z.string()),
	timezone: withExpr(z.string()),
} as const;

export const calcomNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.calcom"),
	type: z.literal("action"),
	credentialId: z.string().nullable().optional(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: calcomNodeValueSchemas.operation,
				default: z.literal("create_booking").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Create Booking", value: "create_booking" },
						{ label: "Cancel Booking", value: "cancel_booking" },
						{ label: "Reschedule Booking", value: "reschedule_booking" },
						{ label: "List Bookings", value: "list_bookings" },
						{ label: "List Event Types", value: "list_event_types" },
						{
							label: "Get Availability Slots",
							value: "get_availability_slots",
						},
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Event Type ID"),
				name: z.literal("eventTypeId"),
				type: z.literal("number"),
				value: calcomNodeValueSchemas.eventTypeId,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("create_booking"),
									z.literal("get_availability_slots"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Start Time"),
				name: z.literal("startTime"),
				type: z.literal("date-time"),
				value: calcomNodeValueSchemas.startTime,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("create_booking"),
									z.literal("reschedule_booking"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Attendee Name"),
				name: z.literal("attendeeName"),
				type: z.literal("input"),
				value: calcomNodeValueSchemas.attendeeName,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_booking")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Attendee Email"),
				name: z.literal("attendeeEmail"),
				type: z.literal("input"),
				value: calcomNodeValueSchemas.attendeeEmail,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("create_booking")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Booking UID"),
				name: z.literal("bookingUid"),
				type: z.literal("input"),
				value: calcomNodeValueSchemas.bookingUid,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.union([
									z.literal("cancel_booking"),
									z.literal("reschedule_booking"),
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Reason"),
				name: z.literal("reason"),
				type: z.literal("textarea"),
				value: calcomNodeValueSchemas.reason,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("cancel_booking")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Status Filter"),
				name: z.literal("status"),
				type: z.literal("dropdown"),
				value: calcomNodeValueSchemas.status,
				default: z.literal("upcoming").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Upcoming", value: "upcoming" },
						{ label: "Past", value: "past" },
						{ label: "Cancelled", value: "cancelled" },
					]),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_bookings")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Limit"),
				name: z.literal("limit"),
				type: z.literal("number"),
				value: calcomNodeValueSchemas.limit,
				default: z.literal("10").optional(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_bookings")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Start Date"),
				name: z.literal("startDate"),
				type: z.literal("date"),
				value: calcomNodeValueSchemas.startDate,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("get_availability_slots")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("End Date"),
				name: z.literal("endDate"),
				type: z.literal("date"),
				value: calcomNodeValueSchemas.endDate,
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("get_availability_slots")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Timezone"),
				name: z.literal("timezone"),
				type: z.literal("input"),
				value: calcomNodeValueSchemas.timezone,
				default: z.literal("UTC").optional(),
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("get_availability_slots")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
