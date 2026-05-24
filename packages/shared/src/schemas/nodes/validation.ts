import { z } from "zod";

const EXPRESSION_PATTERN = /\{\{[^}]*\}\}/;

export function withExpr<T extends z.ZodTypeAny>(schema: T) {
	return z.any().superRefine((val, ctx) => {
		if (typeof val === "string" && EXPRESSION_PATTERN.test(val)) return;
		const result = schema.safeParse(val);
		if (!result.success) {
			ctx.addIssue(
				result.error.issues[0]?.message ?? "Invalid value",
			);
		}
	});
}

export function extractFormSchema(
	registry: Map<string, z.ZodObject>,
	task: string,
	params: Array<{ name: string; required?: boolean }>,
): z.ZodObject<z.ZodRawShape> {
	const nodeSchema = registry.get(task);
	if (!nodeSchema) return z.object({});

	const parametersField = nodeSchema.shape.parameters;
	if (!parametersField) return z.object({});

	const union = parametersField.element;
	if (!union || !union.options) return z.object({});

	const valueSchemaMap = new Map<string, z.ZodTypeAny>();

	for (const option of union.options) {
		const nameSchema = option.shape?.name;
		if (!nameSchema) continue;
		const paramName = nameSchema.value;
		const valueSchema = option.shape?.value;
		if (!valueSchema || paramName === undefined) continue;
		valueSchemaMap.set(paramName, valueSchema);
	}

	if (valueSchemaMap.size === 0) return z.object({});

	const shape: Record<string, z.ZodTypeAny> = {};
	for (const param of params) {
		const valueSchema = valueSchemaMap.get(param.name);
		if (!valueSchema) continue;

		const wrapped = withExpr(valueSchema);
		shape[param.name] = param.required ? wrapped : wrapped.optional();
	}

	return z.object(shape);
}
