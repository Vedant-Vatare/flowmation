import type z from "zod";
import type { arrayTransformNodeSchema } from "@/schemas/nodes/transform/array-transform.schema.js";
import type { dateTimeNodeSchema } from "@/schemas/nodes/transform/date-time.schema.js";
import type { filterNodeSchema } from "@/schemas/nodes/transform/filter.schema.js";
import type { jsonTransformNodeSchema } from "@/schemas/nodes/transform/json-transform.schema.js";
import type { numberTransformNodeSchema } from "@/schemas/nodes/transform/number-transform.schema.js";
import type { setVariableNodeSchema } from "@/schemas/nodes/transform/set-variable.schema.js";
import type { textTransformNodeSchema } from "@/schemas/nodes/transform/text-transform.schema.js";

export type SetVariableNode = z.infer<typeof setVariableNodeSchema>;
export type JsonTransformNode = z.infer<typeof jsonTransformNodeSchema>;
export type TextTransformNode = z.infer<typeof textTransformNodeSchema>;
export type NumberTransformNode = z.infer<typeof numberTransformNodeSchema>;
export type ArrayTransformNode = z.infer<typeof arrayTransformNodeSchema>;
export type DateTimeNode = z.infer<typeof dateTimeNodeSchema>;
export type FilterNode = z.infer<typeof filterNodeSchema>;
