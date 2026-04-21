import type { NodeJobPayload } from "@nodebase/queue";
import {
	completeNodeExecutionQuery,
	createNodeExecutionQuery,
	createNodeExecutionRecordQuery,
} from "@/queries/workflow.executions.js";
import { storeNodeOutput } from "@/services/executionStore.js";
import { broadcastExecutionUpdate } from "./sse.utils.js";

export const recordNodeStart = async (jobData: NodeJobPayload) => {
	if (!jobData.nodeExecutionId)
		throw new Error("node execution cannot be undefined");

	const executionId = await createNodeExecutionQuery(
		jobData.workflowId,
		jobData.node.id,
		jobData.nodeExecutionId,
		jobData.executionId,
	);
	broadcastExecutionUpdate(jobData, {
		type: "node:started",
		nodeId: jobData.node.id,
		startedAt: new Date(),
	});

	return executionId;
};

export const recordNodeCompletion = async (
	jobData: NodeJobPayload,
	nodeOutput: unknown,
) => {
	if (!jobData.nodeExecutionId)
		throw new Error("node execution cannot be undefined");

	const nodeDbUpdate = completeNodeExecutionQuery(
		jobData.nodeExecutionId,
		nodeOutput,
	);
	const saveToStore = storeNodeOutput(
		jobData.executionId,
		jobData.node.name,
		nodeOutput,
	);
	broadcastExecutionUpdate(jobData, {
		type: "node:completed",
		nodeId: jobData.node.id,
		output: nodeOutput,
		completedAt: new Date(),
	});

	await Promise.all([nodeDbUpdate, saveToStore]);
};

// directly marking node as executed without start record.
export const recordNodeExecution = async (
	jobData: NodeJobPayload,
	nodeOutput: unknown,
) => {
	const saveToDB = createNodeExecutionRecordQuery(
		jobData.workflowId,
		jobData.node.id,
		jobData.executionId,
		nodeOutput,
	);
	const saveToStore = storeNodeOutput(
		jobData.executionId,
		jobData.node.name,
		nodeOutput,
	);
	broadcastExecutionUpdate(jobData, {
		type: "node:completed",
		nodeId: jobData.node.id,
		output: nodeOutput,
		completedAt: new Date(),
	});

	await Promise.all([saveToDB, saveToStore]);
};
