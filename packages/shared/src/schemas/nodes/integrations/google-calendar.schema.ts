import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

export const googleCalendarNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.google_calendar"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: z.string(),
				default: z.literal("list_events").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "List Events", value: "list_events" },
						{ label: "Create Event", value: "create_event" },
						{ label: "Update Event", value: "update_event" },
						{ label: "Delete Event", value: "delete_event" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Calendar ID"),
				name: z.literal("calendarId"),
				type: z.literal("input"),
				value: z.string(),
				default: z.literal("primary").optional(),
				required: z.boolean(),
			description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum([
									"list_events",
									"create_event",
									"update_event",
									"delete_event",
								]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Time Min"),
				name: z.literal("timeMin"),
				type: z.literal("date-time"),
				value: z.string(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_events")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Time Max"),
				name: z.literal("timeMax"),
				type: z.literal("date-time"),
				value: z.string(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_events")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Max Results"),
				name: z.literal("maxResults"),
				type: z.literal("number"),
				value: z.string(),
				default: z.literal("50").optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_events")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Query"),
				name: z.literal("query"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("list_events")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Event ID"),
				name: z.literal("eventId"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["update_event", "delete_event"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Summary"),
				name: z.literal("summary"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_event", "update_event"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Description"),
				name: z.literal("description"),
				type: z.literal("textarea"),
				value: z.string(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_event", "update_event"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Location"),
				name: z.literal("location"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_event", "update_event"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Start Time"),
				name: z.literal("startTime"),
				type: z.literal("date-time"),
				value: z.string(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_event", "update_event"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("End Time"),
				name: z.literal("endTime"),
				type: z.literal("date-time"),
				value: z.string(),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_event", "update_event"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Time Zone"),
				name: z.literal("timeZone"),
				type: z.literal("input"),
				value: z.string(),
				default: z.literal("UTC").optional(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["create_event", "update_event"])),
						}),
					)
					.optional(),
			}),
		]),
	),
});
