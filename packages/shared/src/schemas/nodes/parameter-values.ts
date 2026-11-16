import { z } from "zod";

const jsonObject = z.record(z.string(), z.json());
const jsonRecords = z.union([jsonObject, z.array(jsonObject)]);

function parseJson(value: unknown, ctx: z.RefinementCtx): unknown {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		ctx.addIssue({ code: "custom", message: "Must contain valid JSON" });
		return z.NEVER;
	}
}

export const jsonObjectInputSchema = z.union([z.string(), jsonObject]);
export const jsonRecordsInputSchema = z.union([z.string(), jsonRecords]);
export const jsonObjectValueSchema = z.preprocess(parseJson, jsonObject);
export const jsonRecordsValueSchema = z.preprocess(parseJson, jsonRecords);
export const jsonValueSchema = z.preprocess(parseJson, z.json());

export const stringListInputSchema = z.union([z.string(), z.array(z.string())]);

export const boundedStringListInputSchema = z.union([
	z.string().max(2000),
	z.array(z.string().max(2000)),
]);

export const stringListValueSchema = z.preprocess((value, ctx) => {
	if (typeof value !== "string") return value;
	if (value.trimStart().startsWith("[")) return parseJson(value, ctx);

	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}, z.array(z.string()));

export const jsonListValueSchema = z.preprocess((value, ctx) => {
	if (typeof value === "string" && !value.trimStart().startsWith("[")) {
		return value.split(",").map((item) => item.trim());
	}

	return parseJson(value, ctx);
}, z.array(z.json()));

export const booleanInputSchema = z.union([
	z.boolean(),
	z.enum(["true", "false"]),
]);

export const booleanValueSchema = booleanInputSchema.transform(
	(value) => value === true || value === "true",
);

export const finiteNumberValueSchema = z
	.union([z.number(), z.string().trim().min(1).transform(Number)])
	.pipe(z.number());
