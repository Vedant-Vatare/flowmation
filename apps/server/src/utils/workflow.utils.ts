import {
	db,
	eq,
	userWorkflowsTable,
	workflowExecutionTable,
} from "@nodebase/db";
import { addWorkflowInQueue, type WorkflowTriggerType } from "@nodebase/queue";
import createHttpError from "http-errors";

type ExecutionData = {
	executionId?: string;
	workflowId: string;
	userId: string;
	triggerNodeId: string;
	triggerType: WorkflowTriggerType;
	triggerData: unknown;
	liveUpdates?: boolean;
};

export const enqueueWorkflow = async (executionData: ExecutionData) => {
	const workflowData = await db.query.userWorkflowsTable.findFirst({
		where: eq(userWorkflowsTable.id, executionData.workflowId),
		with: {
			nodes: true,
			connections: true,
		},
	});
	if (!workflowData) throw createHttpError.NotFound("Workflow not found");

	if (workflowData.userId !== executionData.userId)
		throw createHttpError.Unauthorized();

	const [workflowExecution] = await db
		.insert(workflowExecutionTable)
		.values({
			id: executionData.executionId,
			workflowId: executionData.workflowId,
			status: "running",
			userId: executionData.userId,
		})
		.returning({ id: workflowExecutionTable.id });

	if (!workflowExecution)
		throw createHttpError.InternalServerError(
			"error occured while creating workflow execution",
		);

	await addWorkflowInQueue({
		executionId: workflowExecution.id,
		nodes: workflowData.nodes,
		connections: workflowData.connections,
		...executionData,
	});
	return workflowExecution.id;
};
