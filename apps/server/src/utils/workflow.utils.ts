import {
	db,
	eq,
	userWorkflowsTable,
	workflowExecutionTable,
	workflowSnapshotsTable,
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
	});

	if (!workflowData) throw createHttpError.NotFound("Workflow not found");

	if (workflowData.userId !== executionData.userId)
		throw createHttpError.Unauthorized();

	const [snapshot] = await db
		.select()
		.from(workflowSnapshotsTable)
		.where(eq(workflowSnapshotsTable.workflowId, executionData.workflowId));

	if (!snapshot) {
		throw createHttpError.BadRequest(
			"Workflow not published. Please publish the workflow before executing.",
		);
	}

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
		nodes: snapshot.nodes,
		connections: snapshot.connections,
		...executionData,
	});
	return workflowExecution.id;
};
