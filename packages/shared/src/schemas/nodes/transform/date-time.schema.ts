import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";
import { withExpr } from "../validation.js";

export const dateTimeNodeValueSchemas = {
	operation: withExpr(
		z.enum(["now", "format", "parse", "add", "subtract", "extract", "diff"]),
	),
	input_date: withExpr(z.string()),
	format: withExpr(z.string()),
	output_format: withExpr(z.string()),
	amount: withExpr(z.coerce.number()),
	unit: withExpr(z.enum(["seconds", "minutes", "hours", "days", "weeks", "months", "years"])),
	part: withExpr(z.enum(["year", "month", "day", "hour", "minute", "second", "weekday", "timestamp"])),
	end_date: withExpr(z.string()),
} as const;

export const dateTimeNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.date_time"),
	type: z.literal("action"),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: dateTimeNodeValueSchemas.operation,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Input Date"),
				name: z.literal("input_date"),
				type: z.literal("input"),
				value: dateTimeNodeValueSchemas.input_date,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["format", "parse", "add", "subtract", "extract", "diff"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Format"),
				name: z.literal("format"),
				type: z.literal("input"),
				value: dateTimeNodeValueSchemas.format,
				placeholder: z.string().optional(),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("format")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Output Format"),
				name: z.literal("output_format"),
				type: z.literal("dropdown"),
				value: dateTimeNodeValueSchemas.output_format,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["now", "parse"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Amount"),
				name: z.literal("amount"),
				type: z.literal("number"),
				value: dateTimeNodeValueSchemas.amount,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["add", "subtract"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Unit"),
				name: z.literal("unit"),
				type: z.literal("dropdown"),
				value: dateTimeNodeValueSchemas.unit,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.enum(["add", "subtract", "diff"])),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Part"),
				name: z.literal("part"),
				type: z.literal("dropdown"),
				value: dateTimeNodeValueSchemas.part,
				options: z.array(z.object({ label: z.string(), value: z.string() })),
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("extract")),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("End Date"),
				name: z.literal("end_date"),
				type: z.literal("input"),
				value: dateTimeNodeValueSchemas.end_date,
				required: z.boolean(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(z.literal("diff")),
						}),
					)
					.optional(),
			}),
		]),
	),
});
