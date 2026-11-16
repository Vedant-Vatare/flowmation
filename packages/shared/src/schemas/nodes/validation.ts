import { z } from "zod";

const EXPRESSION_PATTERN = /\{\{[^}]+\}\}/;
const resolvedValueSchemas = new WeakMap<z.ZodType, z.ZodType>();

export function withExpr<T extends z.ZodType>(
	schema: T,
	resolvedSchema: z.ZodType = schema,
) {
	const expressionSchema = z.pipe(
		z.any(),
		z.union([
			z.string().regex(EXPRESSION_PATTERN, {
				error: "Invalid expression format. use {{variable name}}",
			}),
			z.literal(""),
			schema,
		]),
	);
	// Keep the runtime rule without accepting expression syntax or draft placeholders.
	resolvedValueSchemas.set(expressionSchema, resolvedSchema);
	return expressionSchema;
}

export function getResolvedValueSchema(schema: z.ZodType): z.ZodType {
	return resolvedValueSchemas.get(schema) ?? schema;
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
