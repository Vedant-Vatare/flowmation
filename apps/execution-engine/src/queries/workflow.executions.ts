import {
	db,
	eq,
	nodeExecutionTable,
	userWorkflowsTable,
	workflowExecutionTable,
} from "@nodebase/db";
import type { WorkflowStatus } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";

export const updateWorkflowStatusQuery = async (
	id: string,
	status: WorkflowStatus,
) => {
	return await db
		.update(workflowExecutionTable)
		.set({ status, completedAt: new Date() })
		.where(eq(workflowExecutionTable.id, id))
		.returning();
};

export const updateUserWorkflowStatusQuery = async (
	id: string,
	status: WorkflowStatus,
) => {
	return await db
		.update(userWorkflowsTable)
		.set({ status })
		.where(eq(userWorkflowsTable.id, id))
		.returning();
};

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
) => {
	const [execution] = await db
		.insert(nodeExecutionTable)
		.values({ id: nodeExecutionId, workflowId, instanceId })
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
		.set({ completedAt: new Date(), output })
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
	output?: unknown,
) => {
	const [execution] = await db
		.insert(nodeExecutionTable)
		.values({ workflowId, instanceId, output })
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
