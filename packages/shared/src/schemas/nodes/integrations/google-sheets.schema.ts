import z from "zod";
import { baseNodeSchema, nodeParameterSchema } from "../base.nodes.js";

export const googleSheetsNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.google_sheets"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				label: z.literal("Operation"),
				name: z.literal("operation"),
				type: z.literal("dropdown"),
				value: z.string(),
				default: z.literal("get_values").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "Get Values", value: "get_values" },
						{ label: "Update Values", value: "update_values" },
						{ label: "Append Values", value: "append_values" },
					]),
				required: z.boolean(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Spreadsheet ID"),
				name: z.literal("spreadsheetId"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["get_values", "update_values", "append_values"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Range"),
				name: z.literal("range"),
				type: z.literal("input"),
				value: z.string(),
				required: z.boolean(),
				placeholder: z.string().optional(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["get_values", "update_values", "append_values"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Values"),
				name: z.literal("values"),
				type: z.literal("textarea"),
				value: z.string(),
				required: z.boolean(),
				description: z.string().optional(),
				placeholder: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["update_values", "append_values"]),
							),
						}),
					)
					.optional(),
			}),
			nodeParameterSchema.extend({
				label: z.literal("Value Input Option"),
				name: z.literal("valueInputOption"),
				type: z.literal("dropdown"),
				value: z.string(),
				default: z.literal("USER_ENTERED").optional(),
				options: z
					.array(z.object({ label: z.string(), value: z.string() }))
					.default([
						{ label: "User Entered", value: "USER_ENTERED" },
						{ label: "Raw", value: "RAW" },
					]),
				required: z.boolean(),
				description: z.string().optional(),
				dependsOn: z
					.array(
						z.object({
							parameter: z.literal("operation"),
							values: z.array(
								z.enum(["update_values", "append_values"]),
							),
						}),
					)
					.optional(),
			}),
		]),
	),
});
