import {
	addNodeInQueue,
	connection,
	NODE_QUEUE_NAME,
	type NodeExecutionConfig,
	type PrevioudExecution,
	WORKFLOW_QUEUE_NAME,
	type WorkflowJobPayload,
} from "@nodebase/queue";
import type { WorkflowNode } from "@nodebase/shared";
import { type Job, QueueEvents, UnrecoverableError, Worker } from "bullmq";
import {
	updateUserWorkflowStatusQuery,
	updateWorkflowStatusQuery,
} from "@/queries/workflow.executions.js";
import {
	handlePreviousNodeExecution,
	nodeExecutionConfig,
} from "@/utils/node.executor.utils.js";

const nodeQueueEvents = new QueueEvents(NODE_QUEUE_NAME, { connection });

export const workflowWorker = new Worker(
	WORKFLOW_QUEUE_NAME,
	async (job: Job<WorkflowJobPayload>) => {
		console.log(
			`executing workflow: ${job.data.workflowId} via ${job.data.triggerType ?? "unknown"}`,
		);

		const triggerResult = await handleWorkflowTrigger(job);
		if (!triggerResult) return;

		const startNode = getStartNodeOfWorkflow(job, triggerResult);

		await handleSequentialNodeExecution(job, startNode);
	},
	{ connection },
);

workflowWorker.on("completed", async (job: Job<WorkflowJobPayload>) => {
	console.log("workflow execution complete for workflow:", job.data.workflowId);
	await updateWorkflowStatusQuery(job.data.executionId, "executed");
	await updateUserWorkflowStatusQuery(job.data.workflowId, "active");
});

workflowWorker.on(
	"failed",
	async (job: Job<WorkflowJobPayload> | undefined, err: Error) => {
		if (!job) return;
		console.error(err);
		await updateWorkflowStatusQuery(job.data.executionId, "failed");
		await updateUserWorkflowStatusQuery(job.data.workflowId, "failed");
	},
);

workflowWorker.on("error", (err) => {
	console.error(err);
});

const handleWorkflowTrigger = async (job: Job<WorkflowJobPayload>) => {
	const { executionId, workflowId, nodes, triggerNodeId, triggerType } =
		job.data;

	if (!triggerType) {
		throw new UnrecoverableError(
			"triggerType is required for workflow execution",
		);
	}

	if (!triggerNodeId) {
		throw new UnrecoverableError(
			"triggerNodeId is required — specify which trigger node fired this execution",
		);
	}

	const triggerNode = nodes.find((n) => n.id === triggerNodeId);

	if (!triggerNode) {
		throw new UnrecoverableError(
			`trigger node ${triggerNodeId} not found in workflow nodes`,
		);
	}

	if (triggerType === "schedule") return null;

	const nodeJob = await addNodeInQueue({
		node: triggerNode,
		executionId,
		workflowId,
	});

	await nodeJob.waitUntilFinished(nodeQueueEvents);

	return triggerNode;
};

const handleSequentialNodeExecution = async (
	job: Job<WorkflowJobPayload>,
	startNode: WorkflowNode,
) => {
	const { nodes, connections, executionId, workflowId } = job.data;

	let currentId: string | undefined = startNode.id;

	/* nodeconfigs is populated when current node is executed and its configs can be passed for the next node execution which is used by worker job configs. */
	let previousExecution: PrevioudExecution = null;
	let nodeConfigs: NodeExecutionConfig = {};

	while (currentId) {
		const node = nodes.find((n) => n.id === currentId);
		if (!node) throw new UnrecoverableError(`node ${currentId} not found`);

		// saving work for  previosly executed node
		handlePreviousNodeExecution(previousExecution, workflowId);

		const nodeJob = await addNodeInQueue(
			{ node, executionId, workflowId },
			nodeConfigs,
		);
		const nodeExecution = await nodeJob.waitUntilFinished(nodeQueueEvents);

		nodeConfigs = nodeExecutionConfig(node, nodeExecution?.output);
		previousExecution = {
			id: nodeExecution.id,
			nodeName: node.name,
			status: nodeExecution.status,
			output: nodeExecution.output,
		};

		currentId = connections.find((c) => c.sourceId === currentId)?.targetId;
	}
};

const getStartNodeOfWorkflow = (
	job: Job<WorkflowJobPayload>,
	triggerNode: WorkflowNode,
) => {
	const { nodes, connections } = job.data;
	const triggerConnection = connections.find(
		(c) => c.sourceId === triggerNode.id,
	);
	const startNode = nodes.find((n) => n.id === triggerConnection?.targetId);

	if (!startNode) {
		throw new UnrecoverableError("trigger node has no connected action nodes");
	}

	return startNode;
};
