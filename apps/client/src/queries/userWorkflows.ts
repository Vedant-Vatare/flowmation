import type { WorkflowNode } from "@nodebase/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	addWorkflowNodeApi,
	deleteWorkflowNodeApi,
	getUserWorkflowsApi,
	getWorkflowConnections,
	getWorkflowNodes,
} from "@/apis/userWorkflow";

export const useUserWorkflowQuery = () =>
	useQuery({
		queryKey: ["user-workflows"],
		queryFn: getUserWorkflowsApi,
	});

export const useWorkflowNodesQuery = (workflowId: string) =>
	useQuery({
		queryKey: ["workflow-nodes", { workflowId }],
		queryFn: () => getWorkflowNodes(workflowId),
	});

export const useWorkflowConnectionsQuery = (workflowId: string) =>
	useQuery({
		queryKey: ["workflow-connections", { workflowId }],
		queryFn: () => getWorkflowConnections(workflowId),
	});

export const useAddWorkflowNode = () =>
	useMutation({
		mutationFn: (node: WorkflowNode) => addWorkflowNodeApi(node),
	});

export const useDeleteWorkflowNode = () =>
	useMutation({
		mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) =>
			deleteWorkflowNodeApi(id, workflowId),
	});
