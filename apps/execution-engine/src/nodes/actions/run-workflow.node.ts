import {
	and,
	db,
	eq,
	userWorkflowsTable,
	workflowSnapshotsTable,
} from "@nodebase/db";
import { addWorkflowInQueue, type NodeJobPayload } from "@nodebase/queue";
import {
	callableWorkflowTargetSchema,
	type RunWorkflowNode,
} from "@nodebase/shared";
import { z } from "zod";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const runWorkflowNodeExecutor = async (
	job: NodeJobPayload,
): Promise<NodeExecutorOutput> => {
	const { userId, workflowId, executionId, childExecutionId } = job;
	if (!userId || !childExecutionId) {
		return {
			success: false,
			retryable: false,
			message: "Workflow call context is missing",
		};
	}

	const params = await getResolvedParams(
		job.node as RunWorkflowNode,
		executionId,
	);
	const target = callableWorkflowTargetSchema.safeParse(params.target?.value);
	if (!target.success) {
		return {
			success: false,
			retryable: false,
			message: "Select a callable workflow trigger",
		};
	}

	const [targetWorkflowId, triggerNodeId] = target.data
		.toLowerCase()
		.split("/") as [string, string];
	const callerWorkflowIds = [...(job.callerWorkflowIds ?? []), workflowId];
	if (callerWorkflowIds.includes(targetWorkflowId)) {
		return {
			success: false,
			retryable: false,
			message: "Circular workflow call",
		};
	}

	const [snapshot] = await db
		.select({
			nodes: workflowSnapshotsTable.nodes,
			connections: workflowSnapshotsTable.connections,
		})
		.from(workflowSnapshotsTable)
		.innerJoin(
			userWorkflowsTable,
			eq(userWorkflowsTable.id, workflowSnapshotsTable.workflowId),
		)
		.where(
			and(
				eq(userWorkflowsTable.id, targetWorkflowId),
				eq(userWorkflowsTable.userId, userId),
			),
		);
	if (
		!snapshot?.nodes.some(
			(node) =>
				node.id === triggerNodeId &&
				node.type === "trigger" &&
				node.task === "trigger.called_by_workflow" &&
				!node.settings.disabled,
		)
	) {
		return {
			success: false,
			retryable: false,
			message: "The selected trigger is unavailable in the published workflow",
		};
	}

	let input: unknown = params.input?.value;

	const inputExpression = job.node.parameters.find(
		(parameter) => parameter.name === "input",
	)?.value;

	const isDirectExpression =
		job.node.settings.hasExpressions &&
		typeof inputExpression === "string" &&
		/^\s*\{\{[^{}]+\}\}\s*$/.test(inputExpression);

	if (typeof input === "string" && !isDirectExpression) {
		try {
			input = input.trim() ? JSON.parse(input) : {};
		} catch {
			return {
				success: false,
				retryable: false,
				message: "Workflow input must be valid JSON",
			};
		}
	}
	const payload = z.json().safeParse(input === undefined ? {} : input);
	if (!payload.success) {
		return {
			success: false,
			retryable: false,
			message: "Workflow input must be valid JSON",
		};
	}

	await addWorkflowInQueue(
		{
			...snapshot,
			executionId: childExecutionId,
			workflowId: targetWorkflowId,
			userId,
			triggerNodeId,
			triggerType: "workflow",
			triggerData: { input: payload.data, parentExecutionId: executionId },
			callerWorkflowIds,
		},
		childExecutionId,
	);

	return {
		success: true,
		output: { workflowId: targetWorkflowId, executionId: childExecutionId },
	};
};
