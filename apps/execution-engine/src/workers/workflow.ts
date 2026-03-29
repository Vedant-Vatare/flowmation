import {
	addNodeInQueue,
	connection,
	NODE_QUEUE_NAME,
	type NodeExecutionConfig,
	WORKFLOW_QUEUE_NAME,
	type WorkflowJobPayload,
} from "@nodebase/queue";
import { type Job, QueueEvents, Worker } from "bullmq";
import {
	completeNodeExecutionQuery,
	updateUserWorkflowStatusQuery,
	updateWorkflowStatusQuery,
} from "@/queries/workflow.executions.js";
import { nodeExecutionConfig } from "@/utils/node.executor.utils.js";

const nodeQueueEvents = new QueueEvents(NODE_QUEUE_NAME, { connection });

export const workflowWorker = new Worker(
	WORKFLOW_QUEUE_NAME,
	async (job: Job<WorkflowJobPayload>) => {
		console.log("executing workflow:", job.data.workflowId);
		await handleSequentialNodeExecution(job);
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

const handleSequentialNodeExecution = async (job: Job<WorkflowJobPayload>) => {
	const { nodes, connections, executionId, workflowId } = job.data;

	const targetIds = new Set(connections.map((c) => c.targetId));
	const startNode = nodes.find((n) => !targetIds.has(n.id));
	if (!startNode) throw new Error("no start node found");

	let currentId: string | undefined = startNode.id;

	// nodeconfigs are populated when node is executed and configs can be passed to next node for execution
	let previousExecution: { id: string; status: string } | null = null;
	let nodeConfigs: NodeExecutionConfig = {};

	while (currentId) {
		const node = nodes.find((n) => n.id === currentId);
		if (!node) throw new Error(`node ${currentId} not found`);

		if (previousExecution?.status === "waiting") {
			await completeNodeExecutionQuery(previousExecution.id, null);
		}

		const nodeJob = await addNodeInQueue({
			node,
			executionId,
			workflowId,
			nodeConfig: nodeConfigs,
		});

		const nodeExecution = await nodeJob.waitUntilFinished(nodeQueueEvents);

		console.log({ nodeExecution });

		nodeConfigs = nodeExecutionConfig(node, nodeExecution?.output);
		previousExecution = {
			id: nodeExecution.id,
			status: nodeExecution.status,
		};

		currentId = connections.find((c) => c.sourceId === currentId)?.targetId;
	}
};
