import {
	db,
	eq,
	userWorkflowsTable,
	workflowExecutionTable,
} from "@nodebase/db";
import { addWorkflowInQueue } from "@nodebase/queue";
import createHttpError from "http-errors";

export const enqueueWorkflow = async (workflowId: string, userId: string) => {
	const workflowData = await db.query.userWorkflowsTable.findFirst({
		where: eq(userWorkflowsTable.id, workflowId),
		with: {
			nodes: true,
			connections: true,
		},
	});
	if (!workflowData) throw createHttpError.NotFound("Workflow not found");
	if (workflowData.userId !== userId) throw createHttpError.Unauthorized();

	const [execution] = await db
		.insert(workflowExecutionTable)
		.values({
			workflowId,
			userId,
			status: "running",
			completedAt: new Date(),
		})
		.returning({ id: workflowExecutionTable.id });

	if (!execution)
		throw createHttpError.ServiceUnavailable(
			"could not initiate exuection of workflow",
		);

	await addWorkflowInQueue({
		workflowId: workflowId,
		executionId: execution.id,
		nodes: workflowData.nodes,
		connections: workflowData.connections,
	});

	return execution;
};
