import { useMutation, useQuery } from "@tanstack/react-query";
import {
	addWorkflowNode,
	getUserWorkflowsApi,
	getWorkflowConnections,
	getWorkflowNodes,
} from "@/apis/userWorkflow";
import type { WorkflowCanvasNode } from "@/constants/nodes";

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
		mutationFn: (node: WorkflowCanvasNode) => addWorkflowNode(node),
	});
