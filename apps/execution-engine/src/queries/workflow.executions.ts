import {
	and,
	db,
	eq,
	nodeExecutionTable,
	workflowExecutionTable,
} from "@nodebase/db";
import { getHumanReviewRunState } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";

export const updateWorkflowStatusQuery = async (
	id: string,
	status: typeof workflowExecutionTable.$inferSelect.status,
	error?: string,
) =>
	db.transaction(async (tx) => {
		if (status === "failed") {
			const [execution] = await tx
				.select({ result: workflowExecutionTable.result })
				.from(workflowExecutionTable)
				.where(eq(workflowExecutionTable.id, id))
				.for("update");
			const review = getHumanReviewRunState(execution?.result ?? null);
			if (review) {
				await tx
					.update(nodeExecutionTable)
					.set({ status: "failed", completedAt: new Date(), output: error })
					.where(
						and(
							eq(nodeExecutionTable.id, review.id),
							eq(nodeExecutionTable.workflowExecutionId, id),
							eq(nodeExecutionTable.status, "running"),
						),
					);
			}
		}
		await tx
			.update(workflowExecutionTable)
			.set({
				status,
				completedAt: new Date(),
				result: error ?? null,
			})
			.where(eq(workflowExecutionTable.id, id));
	});

export const createWorflowExecutionQuery = async (
	id: string,
	userId: string,
	workflowId: string,
) => {
	return await db
		.insert(workflowExecutionTable)
		.values({
			id,
			workflowId,
			userId,
			status: "running",
			executedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: workflowExecutionTable.id,
			set: { status: "running", executedAt: new Date() },
		})
		.returning({ id: workflowExecutionTable.id });
};

export const createNodeExecutionQuery = async (
	workflowId: string,
	instanceId: string,
	nodeExecutionId: string,
	workflowExecutionId: string,
) => {
	const [execution] = await db
		.insert(nodeExecutionTable)
		.values({
			id: nodeExecutionId,
			workflowExecutionId,
			workflowId,
			instanceId,
			status: "running",
		})
		.returning({ id: nodeExecutionTable.id });
	if (!execution)
		throw new UnrecoverableError("workflow node could not be saved");
	return execution.id;
};

export const completeNodeExecutionQuery = async (
	id: string,
	output: unknown,
) => {
	return await db
		.update(nodeExecutionTable)
		.set({ completedAt: new Date(), output, status: "success" })
		.where(eq(nodeExecutionTable.id, id));
};
export const NodeExecutionFailedQuery = async (id: string, output: unknown) => {
	return await db
		.update(nodeExecutionTable)
		.set({ completedAt: new Date(), output, status: "failed" })
		.where(eq(nodeExecutionTable.id, id));
};

export const deleteWorkflowExecutionQuery = async (executionId: string) => {
	if (!executionId) return { success: false };

	const query = await db
		.delete(workflowExecutionTable)
		.where(eq(workflowExecutionTable.id, executionId));

	if (query.rowCount === 0) {
		throw new UnrecoverableError("workflow could not be deleted");
	}

	return { success: true };
};

export const createNodeExecutionRecordQuery = async (
	workflowId: string,
	instanceId: string,
	workflowExecutionId: string,
	output?: unknown,
) => {
	const [execution] = await db
		.insert(nodeExecutionTable)
		.values({
			workflowId,
			instanceId,
			output,
			workflowExecutionId,
			status: "success",
		})
		.returning({ id: nodeExecutionTable.id });
	if (!execution)
		throw new UnrecoverableError("workflow node could not be saved");
	return execution.id;
};

export const deleteNodeExecutionQuery = async (executionId: string) => {
	if (!executionId) return { success: false };

	const query = await db
		.delete(nodeExecutionTable)
		.where(eq(nodeExecutionTable.id, executionId));

	if (query.rowCount === 0) {
		throw new UnrecoverableError("node was not found");
	}

	return { success: true };
};
