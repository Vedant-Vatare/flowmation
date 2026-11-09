import {
	type HumanInTheLoopNode,
	humanReviewDeclineSchema,
} from "@nodebase/shared";
import { z } from "zod";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const humanInTheLoopNodeExecutor = async (
	node: HumanInTheLoopNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	const params = await getResolvedParams(node, executionId);
	const message = z
		.string()
		.trim()
		.min(1)
		.max(4000)
		.safeParse(params.message?.value);
	const onDecline = humanReviewDeclineSchema.safeParse(
		params.on_decline?.value ?? "stop",
	);
	const allowEdits = params.allow_edits?.value ?? "yes";
	if (
		!message.success ||
		!onDecline.success ||
		!["yes", "no"].includes(allowEdits)
	) {
		return {
			success: false,
			retryable: false,
			message: "Check the review request and decision settings.",
		};
	}

	let content: unknown = params.content?.value ?? null;
	const source = node.parameters.find(({ name }) => name === "content")?.value;
	const directExpression =
		node.settings.hasExpressions &&
		typeof source === "string" &&
		/^\s*\{\{[^{}]+\}\}\s*$/.test(source);
	if (typeof content === "string" && !directExpression && content.trim()) {
		try {
			content = JSON.parse(content);
		} catch {
			// Plain text is valid review content.
		}
	}
	const parsed = z.json().safeParse(content);
	if (!parsed.success) {
		return {
			success: false,
			retryable: false,
			message: "Review content must be text or JSON.",
		};
	}

	return {
		success: true,
		review: {
			message: message.data,
			content: parsed.data,
			allowEdits: allowEdits === "yes",
			onDecline: onDecline.data,
		},
	};
};
