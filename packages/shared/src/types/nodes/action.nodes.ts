import type z from "zod";
import type { cronJobNodeSchema } from "@/schemas/index.js";
import type {
	httpNodeSchema,
	mergeDataNodeSchema,
	waitingNodeSchema,
} from "@/schemas/nodes/action.nodes.js";
import type {
	conditionalNodeSchema,
	loopNodeSchema,
	runWorkflowNodeSchema,
	switchNodeSchema,
} from "@/schemas/nodes/control.nodes.js";
import type { humanInTheLoopNodeSchema } from "@/schemas/nodes/human-in-the-loop.schema.js";

export type HttpNode = z.infer<typeof httpNodeSchema>;
export type WaitNode = z.infer<typeof waitingNodeSchema>;
export type CronNode = z.infer<typeof cronJobNodeSchema>;
export type ConditionNode = z.infer<typeof conditionalNodeSchema>;
export type SwitchNode = z.infer<typeof switchNodeSchema>;
export type RunWorkflowNode = z.infer<typeof runWorkflowNodeSchema>;
export type HumanInTheLoopNode = z.infer<typeof humanInTheLoopNodeSchema>;
export type LoopNode = z.infer<typeof loopNodeSchema>;
export type MergeNode = z.infer<typeof mergeDataNodeSchema>;
