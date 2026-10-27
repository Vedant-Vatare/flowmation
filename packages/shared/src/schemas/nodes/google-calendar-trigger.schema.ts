import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "./base.nodes.js";

const staticText = z
	.string()
	.trim()
	.refine((value) => !value.includes("{{") && !value.includes("}}"), {
		error: "Calendar trigger settings cannot contain expressions",
	});

export const googleCalendarTriggerNodeValueSchemas = {
	calendarId: staticText.pipe(z.string().min(1).max(1024)),
	event: z.enum(["created", "updated", "cancelled", "created_or_updated"]),
	titleContains: staticText.pipe(z.string().max(500)),
	includeAllDay: z.boolean(),
} as const;

export const googleCalendarTriggerNodeSchema = baseNodeSchema.extend({
	task: z.literal("trigger.google_calendar"),
	type: z.literal("trigger"),
	credentialProvider: z.literal("google").default("google"),
	inputPorts: z.tuple([]).default([]),
	outputPorts: z
		.tuple([
			z.object({ name: z.literal("default"), label: z.literal("Default") }),
		])
		.default([{ name: "default", label: "Default" }]),
	parameters: z.tuple([
		nodeParameterSchema.extend({
			name: z.literal("calendarId"),
			label: z.literal("Calendar ID"),
			type: z.literal("input"),
			value: googleCalendarTriggerNodeValueSchemas.calendarId,
			default: z.literal("primary").default("primary"),
			required: z.literal(true).default(true),
		}),
		nodeParameterSchema.extend({
			name: z.literal("event"),
			label: z.literal("Trigger On"),
			type: z.literal("dropdown"),
			value: googleCalendarTriggerNodeValueSchemas.event,
			default: z.literal("created_or_updated").default("created_or_updated"),
			required: z.literal(true).default(true),
			options: nodeParameterSchema.shape.options.default([
				{ label: "Event Created", value: "created" },
				{ label: "Event Updated", value: "updated" },
				{ label: "Event Cancelled / Deleted", value: "cancelled" },
				{ label: "Event Created or Updated", value: "created_or_updated" },
			]),
		}),
		nodeParameterSchema.extend({
			name: z.literal("titleContains"),
			label: z.literal("Title Contains"),
			type: z.literal("input"),
			value: googleCalendarTriggerNodeValueSchemas.titleContains,
			default: z.literal("").default(""),
			required: z.literal(false).default(false),
		}),
		nodeParameterSchema.extend({
			name: z.literal("includeAllDay"),
			label: z.literal("Include All-Day Events"),
			type: z.literal("boolean"),
			value: googleCalendarTriggerNodeValueSchemas.includeAllDay,
			default: z.literal(true).default(true),
			required: z.literal(false).default(false),
		}),
	]),
});
