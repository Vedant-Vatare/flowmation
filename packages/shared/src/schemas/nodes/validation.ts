import { z } from "zod";

const EXPRESSION_PATTERN = /\{\{[^}]+\}\}/;

export function withExpr<T extends z.ZodType>(schema: T) {
	return z.pipe(
		z.any(),
		z.union([z.string().regex(EXPRESSION_PATTERN), z.literal(""), schema]),
	);
}

export function extractFormSchema(
	registry: Map<string, Record<string, z.ZodType>>,
	task: string,
	params: Array<{ name: string; required?: boolean }>,
): z.ZodObject<z.ZodRawShape> {
	const valueSchemas = registry.get(task);
	if (!valueSchemas) return z.object({});

	const shape: Record<string, z.ZodTypeAny> = {};
	for (const param of params) {
		const valueSchema = valueSchemas[param.name];
		if (!valueSchema) continue;
		shape[param.name] = param.required ? valueSchema : valueSchema.optional();
	}

	return z.object(shape);
}
