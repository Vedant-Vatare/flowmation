import { z } from "zod";
import { baseNodeSchema, nodeParameterSchema } from "./base.nodes.js";
import { withExpr } from "./validation.js";

export const humanReviewDeclineSchema = z.enum(["stop", "route"]);

export const humanInTheLoopNodeValueSchemas = {
	message: withExpr(z.string().trim().min(1).max(4000)),
	content: withExpr(z.string()),
	allow_edits: withExpr(z.enum(["yes", "no"])),
	on_decline: withExpr(humanReviewDeclineSchema),
} as const;

export const humanInTheLoopNodeSchema = baseNodeSchema.extend({
	task: z.literal("action.human_in_the_loop"),
	type: z.literal("action"),
	credentialId: z.uuid().nullable(),
	parameters: z.array(
		z.discriminatedUnion("name", [
			nodeParameterSchema.extend({
				name: z.literal("message"),
				label: z.literal("Review request"),
				type: z.literal("textarea"),
				value: humanInTheLoopNodeValueSchemas.message,
			}),
			nodeParameterSchema.extend({
				name: z.literal("content"),
				label: z.literal("Content to review"),
				type: z.literal("textarea"),
				value: humanInTheLoopNodeValueSchemas.content,
			}),
			nodeParameterSchema.extend({
				name: z.literal("allow_edits"),
				label: z.literal("Allow edits"),
				type: z.literal("dropdown"),
				value: humanInTheLoopNodeValueSchemas.allow_edits,
			}),
			nodeParameterSchema.extend({
				name: z.literal("on_decline"),
				label: z.literal("If declined"),
				type: z.literal("dropdown"),
				value: humanInTheLoopNodeValueSchemas.on_decline,
			}),
		]),
	),
});

export type HumanReviewRequest = {
	message: string;
	content: z.infer<ReturnType<typeof z.json>>;
	allowEdits: boolean;
	onDecline: z.infer<typeof humanReviewDeclineSchema>;
};
