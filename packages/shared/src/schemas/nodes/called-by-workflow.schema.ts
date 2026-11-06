import { z } from "zod";
import { baseTriggerNodeSchema } from "./trigger.nodes.js";

export const calledByWorkflowNodeSchema = baseTriggerNodeSchema.extend({
	task: z.literal("trigger.called_by_workflow"),
	type: z.literal("trigger"),
	parameters: z.tuple([]),
});
