import {
	db,
	eq,
	userWorkflowsTable,
	workflowExecutionTable,
} from "@nodebase/db";
import type { WorkflowStatus } from "@nodebase/shared";

export const updateWorkflowStatusQuery = async (
	id: string,
	status: WorkflowStatus,
) => {
	return await db
		.update(workflowExecutionTable)
		.set({ status })
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
