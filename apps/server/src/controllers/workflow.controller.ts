import {
	and,
	db,
	eq,
	sql,
	userWorkflowsTable,
	workflowConnectionsTable,
	workflowExecutionTable,
	workflowNodesTable,
	workflowSnapshotsTable,
} from "@nodebase/db";
import {
	publishWorkflowWithTriggers,
	unpublishWorkflowWithTriggers,
} from "@nodebase/integrations";
import { removeScheduledWorkflow, scheduleWorkflow } from "@nodebase/queue";
import type { CreateWorkflow, UpdateUserWorkflow } from "@nodebase/shared";
import { parseScheduleParams } from "@nodebase/shared/utils";
import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { isDBQueryError } from "@/utils/api.utils.js";

export const createWorkflow = async (req: Request, res: Response) => {
	try {
		const userId = res.locals.userId as string;
		const workflow = req.body as CreateWorkflow;
		const [userWorkflow] = await db
			.insert(userWorkflowsTable)
			.values({ ...workflow, userId, status: "inactive" })
			.returning();

		return res
			.status(201)
			.json({ message: "user workflow created", userWorkflow });
	} catch (e) {
		const queryError = isDBQueryError(e);

		if (queryError?.code === "23505") {
			throw createHttpError.Conflict("workflow with the name already exists");
		}
		throw e;
	}
};

export const updateUserWorkflow = async (req: Request, res: Response) => {
	try {
		const workflowId = req.params.id as string;
		const userId = res.locals.userId as string;
		const workflowData = req.body as UpdateUserWorkflow;

		if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

		const updatedWorkflow = await db
			.update(userWorkflowsTable)
			.set(workflowData)
			.where(
				and(
					eq(userWorkflowsTable.id, workflowId),
					eq(userWorkflowsTable.userId, userId),
				),
			)
			.returning();

		return res.status(200).json({
			message: "workflow updated",
			workflow: updatedWorkflow[0],
		});
	} catch (e) {
		const queryError = isDBQueryError(e);
		if (queryError?.code === "23503") {
			throw createHttpError.NotFound("workflow not found");
		}
		throw e;
	}
};

export const getUserWorkflow = async (req: Request, res: Response) => {
	const workflowId = req.params.id;
	const userId = res.locals.userId as string;
	if (!workflowId || Array.isArray(workflowId))
		throw createHttpError.BadRequest("invalid workflow id");

	const userWorkflows = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.userId, userId),
				eq(userWorkflowsTable.id, workflowId),
			),
		);

	return res
		.status(200)
		.json({ message: "user workflow fetched", userWorkflows });
};

export const getAllUserWorkflow = async (_req: Request, res: Response) => {
	const userId = res.locals.userId as string;
	const userWorkflows = await db
		.select()
		.from(userWorkflowsTable)
		.where(eq(userWorkflowsTable.userId, userId));

	return res
		.status(200)
		.json({ message: "all workflows fetched", userWorkflows });
};

export const getDashboardWorkflows = async (_req: Request, res: Response) => {
	const userId = res.locals.userId as string;

	const workflows = await db
		.select({
			id: userWorkflowsTable.id,
			name: userWorkflowsTable.name,
			status: userWorkflowsTable.status,
		})
		.from(userWorkflowsTable)
		.where(eq(userWorkflowsTable.userId, userId));

	const executions = await db
		.select({
			workflowId: workflowExecutionTable.workflowId,
			executionCount: sql<number>`count(*)`.mapWith(Number),
			lastExecutedAt: sql<
				Date | string | null
			>`max(${workflowExecutionTable.executedAt})`,
		})
		.from(workflowExecutionTable)
		.where(eq(workflowExecutionTable.userId, userId))
		.groupBy(workflowExecutionTable.workflowId);

	const executionsByWorkflow = new Map(
		executions.map((execution) => [execution.workflowId, execution]),
	);

	const dashboardWorkflows = workflows.map((workflow) => {
		const execution = executionsByWorkflow.get(workflow.id);
		const executionCount = execution?.executionCount ?? 0;
		let lastExecutedAt: string | null = null;

		if (execution?.lastExecutedAt) {
			lastExecutedAt = new Date(execution.lastExecutedAt).toISOString();
		}

		return {
			...workflow,
			name: workflow.name ?? "Untitled Workflow",
			executionCount,
			lastExecutedAt,
		};
	});

	return res.status(200).json({ workflows: dashboardWorkflows });
};

export const publishWorkflow = async (req: Request, res: Response) => {
	const workflowId = req.params.id as string;
	const userId = res.locals.userId as string;

	if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

	const [workflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.id, workflowId),
				eq(userWorkflowsTable.userId, userId),
			),
		);

	if (!workflow) throw createHttpError.NotFound("workflow not found");

	const nodes = await db
		.select()
		.from(workflowNodesTable)
		.where(eq(workflowNodesTable.workflowId, workflowId));

	const connections = await db
		.select()
		.from(workflowConnectionsTable)
		.where(eq(workflowConnectionsTable.workflowId, workflowId));

	await publishWorkflowWithTriggers(workflowId, userId, nodes, connections);

	const scheduleNode = nodes.find((n) => n.task === "trigger.cron");
	if (scheduleNode) {
		const repeat = parseScheduleParams(scheduleNode);
		if (repeat) {
			await scheduleWorkflow(workflowId, userId, nodes, connections, repeat);
		}
	}

	return res.status(200).json({ message: "workflow published successfully" });
};

export const unpublishWorkflow = async (req: Request, res: Response) => {
	const workflowId = req.params.id as string;
	const userId = res.locals.userId as string;

	if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

	const [workflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.id, workflowId),
				eq(userWorkflowsTable.userId, userId),
			),
		);

	if (!workflow) throw createHttpError.NotFound("workflow not found");

	await unpublishWorkflowWithTriggers(workflowId, userId);

	await removeScheduledWorkflow(workflowId);

	return res.status(200).json({ message: "workflow unpublished successfully" });
};

export const getPublishStatus = async (req: Request, res: Response) => {
	const workflowId = req.params.id as string;
	const userId = res.locals.userId as string;

	if (!workflowId) throw createHttpError.BadRequest("invalid workflow id");

	const [workflow] = await db
		.select()
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.id, workflowId),
				eq(userWorkflowsTable.userId, userId),
			),
		);

	if (!workflow) throw createHttpError.NotFound("workflow not found");

	const [snapshot] = await db
		.select()
		.from(workflowSnapshotsTable)
		.where(eq(workflowSnapshotsTable.workflowId, workflowId));

	return res.status(200).json({
		isPublished: !!snapshot,
		publishedAt: snapshot?.publishedAt ?? null,
		snapshotNodes: snapshot?.nodes ?? null,
		snapshotConnections: snapshot?.connections ?? null,
	});
};
