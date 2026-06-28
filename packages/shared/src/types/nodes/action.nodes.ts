import type z from "zod";
import type { cronJobNodeSchema } from "@/schemas/index.js";
import type {
	httpNodeSchema,
	mergeDataNodeSchema,
	waitingNodeSchema,
} from "@/schemas/nodes/action.nodes.js";
import type { conditionalNodeSchema, loopNodeSchema } from "@/schemas/nodes/control.nodes.js";
import type { setVariableNodeSchema } from "@/schemas/nodes/transform.nodes.js";

export type SetvariableNode = z.infer<typeof setVariableNodeSchema>;
export type HttpNode = z.infer<typeof httpNodeSchema>;
export type WaitNode = z.infer<typeof waitingNodeSchema>;
export type CronNode = z.infer<typeof cronJobNodeSchema>;
export type ConditionNode = z.infer<typeof conditionalNodeSchema>;
export type LoopNode = z.infer<typeof loopNodeSchema>;
export type MergeNode = z.infer<typeof mergeDataNodeSchema>;
