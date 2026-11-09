import {
	and,
	db,
	desc,
	eq,
	nodeExecutionTable,
	sql,
	userWorkflowsTable,
	workflowExecutionTable,
} from "@nodebase/db";
import { promoteWorkflowReview } from "@nodebase/queue";
import type {
	ExecuteWorkflowRequest,
	LatestWorkflowNodeOutputs,
	PendingHumanReview,
	StoredHumanReview,
} from "@nodebase/shared";
import {
	getHumanReviewRunState,
	HUMAN_REVIEW_PENDING_PREFIX,
	humanReviewDecisionSchema,
} from "@nodebase/shared";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { isDBQueryError } from "@/utils/api.utils.js";
import { enqueueWorkflow } from "@/utils/workflow.utils.js";

export const getPendingHumanReviews = async (req: Request, res: Response) => {
	const workflowId = z.uuid().optional().safeParse(req.query.workflowId);
	if (!workflowId.success)
		throw createHttpError.BadRequest("Invalid workflow ID");
	const rows = await db
		.select({
			id: nodeExecutionTable.id,
			executionId: workflowExecutionTable.id,
			workflowId: workflowExecutionTable.workflowId,
			workflowName: userWorkflowsTable.name,
			executedAt: workflowExecutionTable.executedAt,
			request: sql<
				StoredHumanReview["request"]
			>`${nodeExecutionTable.output} -> 'request'`,
			nodeName: sql<string>`${nodeExecutionTable.output} ->> 'nodeName'`,
		})
		.from(workflowExecutionTable)
		.innerJoin(
			nodeExecutionTable,
			and(
				eq(nodeExecutionTable.workflowExecutionId, workflowExecutionTable.id),
				eq(
					workflowExecutionTable.result,
					sql<string>`${HUMAN_REVIEW_PENDING_PREFIX}::text || ${nodeExecutionTable.id}::text`,
				),
			),
		)
		.innerJoin(
			userWorkflowsTable,
			eq(workflowExecutionTable.workflowId, userWorkflowsTable.id),
		)
		.where(
			and(
				eq(workflowExecutionTable.userId, res.locals.userId),
				eq(workflowExecutionTable.status, "running"),
				sql`${nodeExecutionTable.output} -> 'decision' IS NULL`,
				workflowId.data
					? eq(workflowExecutionTable.workflowId, workflowId.data)
					: undefined,
			),
		)
		.orderBy(desc(workflowExecutionTable.executedAt));

	const reviews: PendingHumanReview[] = rows.map(
		({ request, executedAt, ...execution }) => ({
			...execution,
			...request,
			runStartedAt: executedAt.toISOString(),
		}),
	);
	return res.json({ reviews });
};

export const decideHumanReview = async (req: Request, res: Response) => {
	const ids = z
		.object({ executionId: z.uuid(), reviewId: z.uuid() })
		.safeParse(req.params);
	const decision = humanReviewDecisionSchema.safeParse(req.body);
	if (!ids.success || !decision.success) {
		throw createHttpError.BadRequest(
			"Invalid review decision, content, or note",
		);
	}

	const jobId = await db.transaction(async (tx) => {
		const [execution] = await tx
			.select({
				status: workflowExecutionTable.status,
				result: workflowExecutionTable.result,
			})
			.from(workflowExecutionTable)
			.where(
				and(
					eq(workflowExecutionTable.id, ids.data.executionId),
					eq(workflowExecutionTable.userId, res.locals.userId),
				),
			)
			.for("update");
		if (!execution) throw createHttpError.NotFound("Review not found");
		if (
			execution.status !== "running" ||
			execution.result !== HUMAN_REVIEW_PENDING_PREFIX + ids.data.reviewId
		) {
			throw createHttpError.Conflict("This review is no longer pending");
		}
		const reviewFilter = and(
			eq(nodeExecutionTable.id, ids.data.reviewId),
			eq(nodeExecutionTable.workflowExecutionId, ids.data.executionId),
		);
		const [node] = await tx
			.select({ output: nodeExecutionTable.output })
			.from(nodeExecutionTable)
			.where(reviewFilter)
			.for("update");
		const review = node?.output as StoredHumanReview | undefined;
		if (!review || review.decision)
			throw createHttpError.Conflict("This review is no longer pending");
		if (
			decision.data.content !== undefined &&
			(!review.request.allowEdits || decision.data.decision !== "approved")
		) {
			throw createHttpError.BadRequest(
				"Edits are only accepted when approving a review that allows edits",
			);
		}
		await tx
			.update(nodeExecutionTable)
			.set({ output: { ...review, decision: decision.data } })
			.where(reviewFilter);
		return review.checkpoint.jobId;
	});

	void promoteWorkflowReview(jobId).catch((error: unknown) => {
		console.warn("Could not wake the review job immediately", error);
	});
	return res.status(202).json({ message: "Review decision saved" });
};

export const executeWorkflow = async (req: Request, res: Response) => {
	const workflowId = req.params.id as string;
	const { triggerNodeId, triggerType, liveUpdates } =
		req.body as ExecuteWorkflowRequest;
	if (!triggerNodeId || !triggerType) {
		throw createHttpError.BadRequest(
			" invalid workflow configs. missing trigger node id or trigger type",
		);
	}

	const [userWorkflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.id, workflowId),
				eq(userWorkflowsTable.userId, res.locals.userId),
			),
		);

	if (!userWorkflow) {
		throw createHttpError.NotFound("workflow was not found");
	}
	const executionId = await enqueueWorkflow({
		workflowId,
		userId: res.locals.userId,
		triggerNodeId,
		triggerType,
		triggerData: req.body ?? [],
		liveUpdates,
	});

	return res.status(201).json({
		message: "workflow execution started successfully",
		userWorkflow,
		executionId,
	});
};

export const getWorkflowLogs = async (req: Request, res: Response) => {
	try {
		const workflowId = req.params.workflowId as string;
		const page = Number(req.query.page) || 1;
		const limit = 15;
		const skip = (page - 1) * limit;
		const userId = res.locals.userId;
		if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

		if (!Number.isInteger(page))
			throw createHttpError.BadRequest("page must be integer");

		const workflowLogs = await db
			.select({
				id: workflowExecutionTable.id,
				workflowId: workflowExecutionTable.workflowId,
				userId: workflowExecutionTable.userId,
				status: workflowExecutionTable.status,
				executedAt: workflowExecutionTable.executedAt,
				completedAt: workflowExecutionTable.completedAt,
				result: workflowExecutionTable.result,
			})
			.from(workflowExecutionTable)
			.where(
				and(
					eq(workflowExecutionTable.userId, userId),
					eq(workflowExecutionTable.workflowId, workflowId),
				),
			)
			.orderBy(desc(workflowExecutionTable.executedAt))
			.limit(limit + 1)
			.offset(skip);

		const hasNextPage = workflowLogs.length > limit;

		return res.status(200).json({
			message: "workflow logs fetched successfully",
			logs: workflowLogs.slice(0, limit).map((log) => {
				const review =
					log.status === "running" ? getHumanReviewRunState(log.result) : null;
				return {
					...log,
					status: review?.phase === "pending" ? "waiting" : log.status,
					result: review ? null : log.result,
				};
			}),
			hasNextPage,
		});
	} catch (e) {
		const dbError = isDBQueryError(e);
		console.log(e);

		if (dbError?.code === "22P02")
			throw createHttpError.NotFound("workflow not found");
		throw e;
	}
};

export const getExecutionLogs = async (req: Request, res: Response) => {
	const userId = res.locals.userId;
	const page = Number(req.query.page) || 1;
	const limit = 15;
	const skip = (page - 1) * limit;

	const logs = await db
		.select({
			id: workflowExecutionTable.id,
			workflowId: workflowExecutionTable.workflowId,
			workflowName: userWorkflowsTable.name,
			status: workflowExecutionTable.status,
			executedAt: workflowExecutionTable.executedAt,
			completedAt: workflowExecutionTable.completedAt,
			result: workflowExecutionTable.result,
		})
		.from(workflowExecutionTable)
		.leftJoin(
			userWorkflowsTable,
			eq(workflowExecutionTable.workflowId, userWorkflowsTable.id),
		)
		.where(eq(workflowExecutionTable.userId, userId))
		.orderBy(desc(workflowExecutionTable.executedAt))
		.limit(limit + 1)
		.offset(skip);

	const hasNextPage = logs.length > limit;

	return res.status(200).json({
		logs: logs.slice(0, limit).map(({ result, ...log }) => ({
			...log,
			status:
				log.status === "running" &&
				getHumanReviewRunState(result)?.phase === "pending"
					? "waiting"
					: log.status,
		})),
		hasNextPage,
	});
};

export const getLatestWorkflowNodeOutputs = async (
	req: Request,
	res: Response,
) => {
	const workflowId = z.uuid().safeParse(req.params.workflowId);
	if (!workflowId.success)
		throw createHttpError.BadRequest("Invalid workflow ID");
	const userId = res.locals.userId as string;
	const data = await db.transaction(
		async (tx): Promise<LatestWorkflowNodeOutputs> => {
			const [workflow] = await tx
				.select({ id: userWorkflowsTable.id })
				.from(userWorkflowsTable)
				.where(
					and(
						eq(userWorkflowsTable.id, workflowId.data),
						eq(userWorkflowsTable.userId, userId),
					),
				);
			if (!workflow) throw createHttpError.NotFound("Workflow not found");

			const [execution] = await tx
				.select({
					id: workflowExecutionTable.id,
					status: workflowExecutionTable.status,
					executedAt: workflowExecutionTable.executedAt,
					completedAt: workflowExecutionTable.completedAt,
					result: workflowExecutionTable.result,
				})
				.from(workflowExecutionTable)
				.where(
					and(
						eq(workflowExecutionTable.workflowId, workflowId.data),
						eq(workflowExecutionTable.userId, userId),
					),
				)
				.orderBy(
					desc(workflowExecutionTable.executedAt),
					desc(workflowExecutionTable.id),
				)
				.limit(1);
			if (!execution) return { execution: null, nodeOutputs: [] };
			const review =
				execution.status === "running"
					? getHumanReviewRunState(execution.result)
					: null;

			const rows = await tx
				.selectDistinctOn([nodeExecutionTable.instanceId])
				.from(nodeExecutionTable)
				.where(
					and(
						eq(nodeExecutionTable.workflowId, workflowId.data),
						eq(nodeExecutionTable.workflowExecutionId, execution.id),
					),
				)
				.orderBy(
					nodeExecutionTable.instanceId,
					desc(nodeExecutionTable.executedAt),
					desc(nodeExecutionTable.id),
				);
			return {
				execution: {
					id: execution.id,
					status: review?.phase === "pending" ? "waiting" : execution.status,
					executedAt: execution.executedAt.toISOString(),
					completedAt: execution.completedAt?.toISOString() ?? null,
					result: review ? null : execution.result,
				},
				nodeOutputs: rows.map((row) => {
					const reviewInProgress =
						row.status === "running" && row.id === review?.id;
					return {
						id: row.id,
						workflowNodeId: row.instanceId,
						status:
							reviewInProgress && review.phase === "pending"
								? "waiting"
								: row.status,
						output: reviewInProgress ? null : row.output,
						executedAt: row.executedAt.toISOString(),
						completedAt: row.completedAt?.toISOString() ?? null,
					};
				}),
			};
		},
		{ isolationLevel: "repeatable read" },
	);
	return res.status(200).json(data);
};
