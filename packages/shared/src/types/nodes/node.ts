import type z from "zod";
import type {
	baseNodeSchema,
	nodeCredentialSchema,
	nodeParameterSchema,
	nodePropertyTypeSchema,
	nodeTypesSchema,
	parameterDependSchema,
} from "@/schemas/index.js";

export type Override<T, U> = Omit<T, keyof U> & U;

export type OverrideNodeParams<U> = Override<NodeParameters, U>;

export type OverrideNodeCredentials<U> = Override<NodeCredentials, U>;

export type NodeTypes = z.infer<typeof nodeTypesSchema>;

export type NodeCredentials = z.infer<typeof nodeCredentialSchema>;

export type NodePropertyType = z.infer<typeof nodePropertyTypeSchema>;

export type parameterDepends = z.infer<typeof parameterDependSchema>;

export type NodeParameters = z.infer<typeof nodeParameterSchema>;

export type BaseNode = z.infer<typeof baseNodeSchema>;

export * from "./action.nodes.js";

export * from "./control.nodes.js";

export * from "./transform.nodes.js";

export * from "./trigger.nodes.js";
