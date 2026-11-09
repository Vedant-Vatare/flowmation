import {
	and,
	db,
	eq,
	nodeExecutionTable,
	sql,
	workflowExecutionTable,
} from "@nodebase/db";
import type { WorkflowJobPayload } from "@nodebase/queue";
import {
	getHumanReviewRunState,
	HUMAN_REVIEW_PENDING_PREFIX,
	HUMAN_REVIEW_RESUMING_PREFIX,
	type HumanReviewCheckpoint,
	type HumanReviewRequest,
	type StoredHumanReview,
	type WorkflowNode,
} from "@nodebase/shared";
import { DelayedError, type Job, UnrecoverableError } from "bullmq";
import {
	restoreExecutionOutputs,
	snapshotExecutionOutputs,
} from "@/services/executionStore.js";
import { broadcastExecutionUpdate } from "@/utils/sse.utils.js";
import { recordNodeCompletion } from "@/utils/workflow.updates.utils.js";

const waitForReview = async (job: Job<WorkflowJobPayload>, token?: string) => {
	await job.moveToDelayed(Date.now() + 30_000, token);
	// stop current job execution and  and failure handling.
	throw new DelayedError();
};

export const pauseForReview = async ({
	job,
	token,
	node,
	id,
	request,
	checkpoint,
}: {
	job: Job<WorkflowJobPayload>;
	token?: string;
	node: WorkflowNode;
	id: string;
	request: HumanReviewRequest;
	checkpoint: Omit<HumanReviewCheckpoint, "jobId" | "nodeId" | "outputs">;
}): Promise<never> => {
	const jobId = job.id;
	if (!jobId) throw new UnrecoverableError("Workflow job ID is missing");
	const outputs = await snapshotExecutionOutputs(job.data.executionId);
	const review: StoredHumanReview = {
		request,
		nodeName: node.name,
		checkpoint: { ...checkpoint, nodeId: node.id, jobId, outputs },
	};
	// Use the existing result as a pointer and keep the checkpoint in the node's JSON output.
	await db.transaction(async (tx) => {
		await tx
			.update(workflowExecutionTable)
			.set({ result: HUMAN_REVIEW_PENDING_PREFIX + id })
			.where(eq(workflowExecutionTable.id, job.data.executionId));
		const [saved] = await tx
			.update(nodeExecutionTable)
			.set({ output: review })
			.where(eq(nodeExecutionTable.id, id))
			.returning({ id: nodeExecutionTable.id });
		if (!saved)
			throw new UnrecoverableError(
				"The review node was removed from this run.",
			);
	});
	broadcastExecutionUpdate(job.data, {
		type: "node:waiting",
		nodeExecutionId: id,
		workflowNodeId: node.id,
		task: node.task,
		startedAt: new Date(),
	});
	return waitForReview(job, token);
};

export const resumeWorkflowReview = async (
	job: Job<WorkflowJobPayload>,
	token?: string,
) => {
	const [execution] = await db
		.select({
			status: workflowExecutionTable.status,
			result: workflowExecutionTable.result,
		})
		.from(workflowExecutionTable)
		.where(eq(workflowExecutionTable.id, job.data.executionId));
	if (!execution) return null;
	const { status, result } = execution;
	if (status === "success" || status === "cancelled" || status === "failed") {
		return { finished: true } as const;
	}
	const state = getHumanReviewRunState(result);
	if (!state || !result) return null;
	// A stalled worker that already resumed may have started downstream side effects.
	if (state.phase === "resuming") {
		throw new UnrecoverableError(
			"The workflow was interrupted after resuming human review.",
		);
	}
	const [saved] = await db
		.select({
			review: sql<StoredHumanReview | null>`case when ${nodeExecutionTable.output} ? 'decision' then ${nodeExecutionTable.output} end`,
		})
		.from(nodeExecutionTable)
		.where(
			and(
				eq(nodeExecutionTable.id, state.id),
				eq(nodeExecutionTable.workflowExecutionId, job.data.executionId),
			),
		);
	if (!saved)
		throw new UnrecoverableError("The review node was removed from this run.");
	const review = saved.review;
	if (!review?.decision) return waitForReview(job, token);

	const [claimed] = await db
		.update(workflowExecutionTable)
		.set({ result: HUMAN_REVIEW_RESUMING_PREFIX + state.id })
		.where(
			and(
				eq(workflowExecutionTable.id, job.data.executionId),
				eq(workflowExecutionTable.result, result),
			),
		)
		.returning({ id: workflowExecutionTable.id });
	if (!claimed) return { finished: true } as const;
	const { checkpoint } = review;

	const node = job.data.nodes.find(({ id }) => id === checkpoint.nodeId);
	if (!node)
		throw new UnrecoverableError("The review node is missing from this run.");
	const response = review.decision;
	const approved = response.decision === "approved";
	const cancelled = !approved && review.request.onDecline === "stop";
	const output = {
		decision: response.decision,
		content:
			response.content === undefined
				? review.request.content
				: response.content,
		originalContent: review.request.content,
		note: response.note ?? "",
	};

	await restoreExecutionOutputs(job.data.executionId, checkpoint.outputs);
	await recordNodeCompletion(
		{
			...job.data,
			node,
			nodeExecutionId: state.id,
		},
		output,
	);
	return { finished: false, checkpoint, node, approved, cancelled } as const;
};
