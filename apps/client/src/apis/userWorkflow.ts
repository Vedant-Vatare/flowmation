import type {
	ExecuteWorkflowRequest,
	NodeIdsWithPosition,
	PartialWorkflowNode,
	UserWorkflow,
	WorkflowConnection,
	WorkflowNode,
} from "@nodebase/shared";
import api from "./axios";

export const createUserWorkflowApi = async (name: string) => {
	const response = await api.post<{ userWorkflow: UserWorkflow }>(
		"/workflows/new",
		{ name },
	);
	return response.data.userWorkflow;
};

export const getUserWorkflowsApi = async () => {
	const response = await api.get<{ userWorkflows: UserWorkflow[] }>(
		"/workflows/all",
	);
	return response.data.userWorkflows;
};

export const getWorkflowNodes = async (workflowId: string) => {
	const response = await api.get<{ workflow: WorkflowNode[] }>(
		`/workflow-nodes/${workflowId}`,
	);

	return response.data.workflow;
};
export const getWorkflowConnections = async (workflowId: string) => {
	const response = await api.get<{ workflowConnections: WorkflowConnection[] }>(
		`/workflow-connections/${workflowId}`,
	);

	return response.data.workflowConnections;
};

export const addWorkflowNodeApi = async (node: WorkflowNode) => {
	const response = await api.post<{ userWorkflowNode: WorkflowNode }>(
		"/workflow-nodes",
		{
			node,
		},
	);
	return response.data.userWorkflowNode;
};

export const deleteWorkflowNodeApi = async (id: string, workflowId: string) => {
	const response = await api.delete("/workflow-nodes/", {
		data: { id, workflowId },
	});
	return response.data;
};

type updateWorkflowNodeApi = {
	workflowId: string;
	node: PartialWorkflowNode;
};

export const updateWorkflowNodeApi = async ({
	node,
	workflowId,
}: updateWorkflowNodeApi) => {
	const response = await api.patch(`/workflow-nodes/${workflowId}`, {
		node,
	});
	return response.data.updatedNode as WorkflowNode;
};

export const addWorkflowNodeConnApi = async (
	workflowConnection: WorkflowConnection,
) => {
	const response = await api.post("/workflow-connections/", {
		...workflowConnection,
	});

	return response.data.workflowConnection as WorkflowConnection;
};

export const deleteWorkflowConnApi = async (id: string) => {
	const response = await api.delete(`/workflow-connections/${id}`);
	return response.data;
};

export const updateWorkflowNodeConnApi = async (
	workflowConnection: WorkflowConnection,
) => {
	const response = await api.patch("/workflow-connections/", {
		...workflowConnection,
	});

	return response.data.updatedNodeConnection as WorkflowConnection;
};

type UpdateNodesPositionApi = {
	workflowId: string;
	nodes: NodeIdsWithPosition;
};

export const updateNodesPositionApi = async ({
	workflowId,
	nodes,
}: UpdateNodesPositionApi) => {
	const response = await api.patch(`/workflow-nodes/${workflowId}/positions`, {
		nodes,
	});
	return response.data.nodes as NodeIdsWithPosition;
};

export const executeWorkflowApi = async (
	workflowId: string,
	payload: ExecuteWorkflowRequest,
) => {
	const response = await api.post<{ executionId: string }>(
		`/workflows/run/${workflowId}`,
		payload,
	);
	return response.data;
};
