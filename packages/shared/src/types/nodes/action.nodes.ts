import type z from "zod";
import type {
	mergeDataNodeSchema,
	waitingNodeSchema,
} from "@/schemas/nodes/action.nodes.js";

export type WaitingNode = z.infer<typeof waitingNodeSchema>;

export type MergeData = z.infer<typeof mergeDataNodeSchema>;
