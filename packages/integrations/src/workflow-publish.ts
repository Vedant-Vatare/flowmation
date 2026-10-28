import {
	and,
	db,
	eq,
	workflowSnapshotsTable as snapshots,
	validateWorkflowGraph,
	userWorkflowsTable as workflows,
} from "@nodebase/db";
import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";
import createHttpError from "http-errors";
import { type TriggerSetup, triggerHandlers } from "./triggers.registry.js";

const changePublishedWorkflow = async (
	workflowId: string,
	userId: string,
	workflow?: { nodes: WorkflowNode[]; connections: WorkflowConnection[] },
) => {
	const [owner] = await db
		.select({ id: workflows.id })
		.from(workflows)
		.where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
	if (!owner) throw createHttpError.NotFound("Workflow not found");
	if (workflow) {
		try {
			await validateWorkflowGraph(
				workflowId,
				userId,
				workflow.nodes,
				workflow.connections,
			);
		} catch {
			throw createHttpError.BadRequest(
				"Invalid workflow graph or credential selection",
			);
		}
	}
	const [previous] = await db
		.select()
		.from(snapshots)
		.where(eq(snapshots.workflowId, workflowId));
	const nodes = workflow?.nodes ?? [];
	const tasks = new Set(
		[...(previous?.nodes ?? []), ...nodes].map((node) => node.task),
	);
	const plans: TriggerSetup[] = [];
	let committed = false;
	try {
		for (const task of tasks) {
			const handler = triggerHandlers.get(task);
			if (handler?.prepare)
				plans.push(await handler.prepare(workflowId, userId, nodes));
		}
		await db.transaction(async (tx) => {
			const [currentWorkflow] = await tx
				.select({ id: workflows.id })
				.from(workflows)
				.where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
				.for("update");
			if (!currentWorkflow)
				throw createHttpError.NotFound("Workflow not found");
			const [current] = await tx
				.select()
				.from(snapshots)
				.where(eq(snapshots.workflowId, workflowId));
			if (
				current?.id !== previous?.id ||
				current?.publishedAt.getTime() !== previous?.publishedAt.getTime()
			) {
				throw createHttpError.Conflict(
					"Workflow publication changed during setup; retry with its latest state",
				);
			}
			for (const plan of plans) await plan.save(tx);
			if (workflow) {
				const value = { ...workflow, publishedAt: new Date() };
				if (current)
					await tx
						.update(snapshots)
						.set(value)
						.where(eq(snapshots.workflowId, workflowId));
				else await tx.insert(snapshots).values({ workflowId, ...value });
			} else {
				await tx.delete(snapshots).where(eq(snapshots.workflowId, workflowId));
			}
			await tx
				.update(workflows)
				.set({ status: workflow ? "active" : "inactive" })
				.where(eq(workflows.id, workflowId));
		});
		committed = true;
		const results = await Promise.allSettled(
			plans.map(async (plan) => plan.afterPublish?.()),
		);
		const failures = results
			.filter((result) => result.status === "rejected")
			.map((result) => result.reason);
		if (failures.length)
			throw new AggregateError(
				failures,
				"Workflow changes saved, but some trigger follow-up work failed; retry the operation",
			);
	} catch (error) {
		if (!committed) {
			for (const plan of plans.reverse()) {
				try {
					await plan.rollback?.();
				} catch {
					console.error("Could not clean up a prepared workflow trigger");
				}
			}
		}
		throw error;
	}
};

export const publishWorkflowWithTriggers = async (
	workflowId: string,
	userId: string,
	nodes: WorkflowNode[],
	connections: WorkflowConnection[],
) => {
	await changePublishedWorkflow(workflowId, userId, { nodes, connections });
};

export const unpublishWorkflowWithTriggers = async (
	workflowId: string,
	userId: string,
) => {
	await changePublishedWorkflow(workflowId, userId);
};
