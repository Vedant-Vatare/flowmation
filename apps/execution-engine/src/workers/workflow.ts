import {
	addNodeInQueue,
	connection,
	NODE_QUEUE_NAME,
	type NodeExecutionConfig,
	type PrevioudExecution,
	WORKFLOW_QUEUE_NAME,
	type WorkflowJobPayload,
	type WorkflowNodesWorker,
} from "@nodebase/queue";
import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";
import { type Job, QueueEvents, UnrecoverableError, Worker } from "bullmq";
import { executeTriggerNode } from "@/executer.js";
import {
	completeNodeExecutionQuery,
	createNodeExecutionQuery,
	createNodeExecutionRecordQuery,
	createWorflowExecutionQuery,
	deleteWorkflowExecutionQuery,
	updateUserWorkflowStatusQuery,
	updateWorkflowStatusQuery,
} from "@/queries/workflow.executions.js";
import { getNodesOutputsByName } from "@/services/executionStore.js";
import type { TriggerNodeExecutorOutput } from "@/types/nodes.js";
import {
	handlePreviousNodeExecution,
	nodeExecutionConfig,
} from "@/utils/node.executor.utils.js";

const nodeQueueEvents = new QueueEvents(NODE_QUEUE_NAME, { connection });
await nodeQueueEvents.waitUntilReady();

export const workflowWorker = new Worker(
	WORKFLOW_QUEUE_NAME,
	async (job: Job<WorkflowJobPayload>) => {
		console.log(
			`loading workflow: ${job.data.workflowId} via ${job.data.triggerType ?? "unknown"}`,
		);
		if (job.data.liveUpdates) {
			console.log("initiating live updates for workflow");
		}
		// using new execution id for scheduled runs
		if (job.data.triggerType === "schedule")
			await job.updateData({ ...job.data, executionId: crypto.randomUUID() });

		await createWorflowExecutionQuery(
			job.data.executionId,
			job.data.userId,
			job.data.workflowId,
		);
		const globalPendingBranches: WorkflowNode[] = [];
		const triggerResult = await handleWorkflowTrigger(job);

		if (!triggerResult?.node || triggerResult?.skipCurrentExecution) {
			return { removeRecord: true };
		}

		const startNode = getNextNode(
			job.data.connections,
			triggerResult.node,
			job.data.nodes,
			triggerResult.allowedOutputPorts ?? ["default"],
			globalPendingBranches,
		);

		if (!startNode) {
			throw new UnrecoverableError("does not have any action node");
		}

		await handleSequentialNodeExecution(job, startNode, globalPendingBranches);
	},
	{ connection, concurrency: 50 },
);

workflowWorker.on(
	"completed",
	async (job: Job<WorkflowJobPayload>, result: { removeRecord?: boolean }) => {
		if (!job) return;
		if (result?.removeRecord) {
			await deleteWorkflowExecutionQuery(job.data.executionId);
			console.log("workflow was recorded!", job.data.executionId);
			return;
		}
		console.log(
			"workflow execution complete for workflow:",
			job.data.workflowId,
			job.data.executionId,
		);
		await updateWorkflowStatusQuery(job.data.executionId, "executed");
		await updateUserWorkflowStatusQuery(job.data.workflowId, "active");
	},
);

workflowWorker.on(
	"failed",
	async (job: Job<WorkflowJobPayload> | undefined, err: Error) => {
		if (!job) return;
		console.error(err);

		await deleteWorkflowExecutionQuery(job.data.executionId);
		await updateWorkflowStatusQuery(job.data.executionId, "failed");
		await updateUserWorkflowStatusQuery(job.data.workflowId, "failed");
	},
);

workflowWorker.on("error", (err) => {
	console.error(err);
});

type WorkflowTrigger = {
	node?: WorkflowNode;
	skipCurrentExecution?: boolean;
};

const handleWorkflowTrigger = async (
	job: Job<WorkflowJobPayload>,
): Promise<WorkflowTrigger & TriggerNodeExecutorOutput> => {
	const { nodes, triggerNodeId, triggerType } = job.data;
	if (!triggerType) {
		throw new UnrecoverableError(
			"triggerType is required for workflow execution",
		);
	}

	if (!triggerNodeId) {
		throw new UnrecoverableError("triggerNodeId is required");
	}

	const triggerNode = nodes.find((n) => n.id === triggerNodeId);

	if (!triggerNode) {
		throw new UnrecoverableError(
			`trigger node ${triggerNodeId} not found in workflow nodes`,
		);
	}

	if (triggerType === "schedule") {
		await createNodeExecutionRecordQuery(job.data.workflowId, triggerNode.id);
		return { node: triggerNode };
	}

	const executionId = await createNodeExecutionQuery(
		job.data.workflowId,
		triggerNode.id,
	);
	if (!executionId) {
		throw new UnrecoverableError("could not start trigger node execution");
	}

	/* runs the trigger node and also determines if trigger node and workflow 
  should continue executing */

	const nodeExecution = await executeTriggerNode(triggerNode, job);

	await completeNodeExecutionQuery(executionId, nodeExecution);

	return {
		node: triggerNode,
		skipCurrentExecution: nodeExecution.skipCurrentExecution,
		...nodeExecution,
	};
};

const handleSequentialNodeExecution = async (
	job: Job<WorkflowJobPayload>,
	startNode: WorkflowNode,
	globalPendingBranches: WorkflowNode[],
) => {
	const { nodes, connections, executionId, workflowId } = job.data;

	let currentNode: WorkflowNode | undefined = startNode;
	let previousExecution: PrevioudExecution = null;

	/* nodeconfigs is populated when current node is executed and its configs can be passed for the next node execution which is used by worker job configs. */
	let nodeConfigs: NodeExecutionConfig = {};

	while (currentNode) {
		const node = currentNode;

		// saving work for  previosly executed node
		await handlePreviousNodeExecution(previousExecution, executionId);

		const preExecutionResult = await currentNodePreExecution({
			jobData: job.data,
			node: currentNode,
			globalPendingBranches,
		});

		if (preExecutionResult?.skipCurrent) {
			currentNode = preExecutionResult.nextNode;
			continue;
		}

		const nodeJob = await addNodeInQueue(
			{ node, executionId, workflowId, nodeData: preExecutionResult?.data },
			nodeConfigs,
		);

		nodeJob.waitUntilFinished;
		const nodeExecution = (await nodeJob.waitUntilFinished(
			nodeQueueEvents,
		)) as WorkflowNodesWorker;

		nodeConfigs = nodeExecutionConfig(node, nodeExecution?.output);
		previousExecution = {
			id: nodeExecution.id,
			nodeName: node.name,
			status: nodeExecution.status,
			output: nodeExecution.output,
		};

		currentNode = getNextNode(
			connections,
			node,
			nodes,
			nodeExecution?.allowedNodePorts ?? [],
			globalPendingBranches,
		);

		if (!currentNode && globalPendingBranches.length > 0) {
			currentNode = globalPendingBranches.pop();
			nodeConfigs = {};
			previousExecution = null;
		}
	}
};

const getNextNode = (
	connections: WorkflowConnection[],
	currentNode: WorkflowNode,
	allNodes: WorkflowNode[],
	allowedPorts: string[],
	pendingBranches: WorkflowNode[],
): WorkflowNode | undefined => {
	const _pendingBranchesNames = pendingBranches.map((n) => n.name);

	const outgoing = connections.filter(
		(c) =>
			c.sourceId === currentNode.id &&
			(allowedPorts.length === 0 || allowedPorts.includes(c.sourcePort)),
	);

	if (outgoing.length === 0) return undefined;

	const nextNodes = outgoing
		.map((c) => allNodes.find((n) => n.id === c.targetId))
		.filter((n): n is WorkflowNode => n !== undefined);

	if (nextNodes.length === 0) return undefined;

	nextNodes.sort((a, b) => b.positionY - a.positionY);

	pendingBranches.push(...nextNodes.slice(0, -1));

	return nextNodes.pop();
};

type CurrentNodePreExecution = {
	jobData: WorkflowJobPayload;
	node: WorkflowNode | undefined;
	globalPendingBranches: WorkflowNode[];
	previousExecution?: PrevioudExecution;
};

type CurrentNodePreExecutionResult = {
	skipCurrent: boolean;
	nextNode?: WorkflowNode;
	data?: { inputNodeNames: string[] };
};

const currentNodePreExecution = async ({
	jobData,
	node,
	globalPendingBranches,
}: CurrentNodePreExecution): Promise<
	CurrentNodePreExecutionResult | undefined
> => {
	if (!node) return undefined;

	if (node.task === "action.merge") {
		const incomingConnections = jobData.connections.filter(
			(c) => c.targetId === node.id,
		);

		const inputNodes = jobData.nodes.filter((n) =>
			incomingConnections.some((c) => c.sourceId === n.id),
		);

		const inputNodeNames = inputNodes.map((n) => n.name);

		const inputNodeOutputs = await getNodesOutputsByName(
			jobData.executionId,
			inputNodeNames,
		);

		const allInputsExist = inputNodeOutputs.every((output) => output !== null);

		if (!allInputsExist) {
			return {
				skipCurrent: true,
				nextNode: globalPendingBranches.pop(),
			};
		}

		return {
			skipCurrent: false,
			data: { inputNodeNames },
		};
	}

	return { skipCurrent: false };
};
