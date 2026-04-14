import {
	db,
	eq,
	userWorkflowsTable,
	workflowExecutionTable,
} from "@nodebase/db";
import { addWorkflowInQueue, type WorkflowTriggerType } from "@nodebase/queue";
import createHttpError from "http-errors";

export const enqueueWorkflow = async (
	workflowId: string,
	userId: string,
	triggerNodeId: string,
	triggerType: WorkflowTriggerType,
	liveUpdates: boolean | undefined,
) => {
	const workflowData = await db.query.userWorkflowsTable.findFirst({
		where: eq(userWorkflowsTable.id, workflowId),
		with: {
			nodes: true,
			connections: true,
		},
	});
	if (!workflowData) throw createHttpError.NotFound("Workflow not found");

	if (workflowData.userId !== userId) throw createHttpError.Unauthorized();

	const [workflowExecution] = await db
		.insert(workflowExecutionTable)
		.values({
			workflowId: workflowId,
			status: "waiting",
			userId: userId,
		})
		.returning({ id: workflowExecutionTable.id });

	if (!workflowExecution)
		throw createHttpError.InternalServerError(
			"error occured while creating workflow execution",
		);

	await addWorkflowInQueue({
		workflowId: workflowId,
		userId,
		executionId: workflowExecution.id,
		nodes: workflowData.nodes,
		connections: workflowData.connections,
		triggerNodeId,
		triggerType,
		liveUpdates: liveUpdates,
	});
	return workflowExecution.id;
};
