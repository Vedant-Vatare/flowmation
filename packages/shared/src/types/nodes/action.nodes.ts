import type z from "zod";
import type {
	gmailNodeSchema,
	httpNodeSchema,
	mergeDataNodeSchema,
	waitingNodeSchema,
} from "@/schemas/nodes/action.nodes.js";

export type HTTPNode = z.infer<typeof httpNodeSchema>;

export type WaitingNode = z.infer<typeof waitingNodeSchema>;

export type MergeData = z.infer<typeof mergeDataNodeSchema>;

export type GmailNode = z.infer<typeof gmailNodeSchema>;
