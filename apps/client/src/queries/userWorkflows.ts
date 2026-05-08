import type {
	ExecuteWorkflowRequest,
	PartialWorkflowNode,
	WorkflowNode,
} from "@nodebase/shared";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import {
	addWorkflowNodeApi,
	addWorkflowNodeConnApi,
	createUserWorkflowApi,
	deleteWorkflowConnApi,
	deleteWorkflowNodeApi,
	executeWorkflowApi,
	getUserWorkflowsApi,
	getWorkflowConnections,
	getWorkflowNodes,
	updateNodesPositionApi,
	updateWorkflowNodeApi,
	updateWorkflowNodeConnApi,
	workflowExecutionLogsApi,
} from "@/apis/userWorkflow";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useSSE } from "@/hooks/useSSE";
import { useWorkflowExecutionStore } from "@/store/workflow/useWorkflowStore";
import { getErrorMessage } from "@/utils/error";

export const useCreateUserWorkflowQuery = () =>
	useMutation({
		mutationFn: createUserWorkflowApi,
	});

export const useUserWorkflowQuery = () =>
	useQuery({
		queryKey: ["user-workflows"],
		queryFn: getUserWorkflowsApi,
	});

export const useWorkflowNodesQuery = (workflowId: string) =>
	useQuery({
		queryKey: ["workflow-nodes", { workflowId }],
		queryFn: () => getWorkflowNodes(workflowId),
		staleTime: Number.POSITIVE_INFINITY,
	});

export const useWorkflowConnectionsQuery = (workflowId: string) =>
	useQuery({
		queryKey: ["workflow-connections", { workflowId }],
		queryFn: () => getWorkflowConnections(workflowId),
		staleTime: Number.POSITIVE_INFINITY,
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

export const useUpdateWorkflowNode = () => {
	const { setNodes } = useReactFlow<WorkflowCanvasNode>();

	return useMutation({
		mutationFn: ({
			workflowId,
			node,
		}: {
			workflowId: string;
			node: PartialWorkflowNode;
		}) => updateWorkflowNodeApi({ node, workflowId }),
		onSuccess: (_, variables) => {
			if (!variables.node.id) return;

			const { id: nodeId, parameters, name, config } = variables.node;

			setNodes((nds) =>
				nds.map((n) => {
					if (n.id !== nodeId) return n;
					return {
						...n,
						data: {
							...n.data,
							...(name && { name }),
							...(parameters && { parameters }),
							...(config && { config }),
						},
					};
				}),
			);
		},
	});
};

export const useAddWorkflowConn = () =>
	useMutation({
		mutationFn: addWorkflowNodeConnApi,
	});

export const useDeleteWorkflowConn = () =>
	useMutation({
		mutationFn: deleteWorkflowConnApi,
	});

export const useUpdateWorkflowConn = () =>
	useMutation({
		mutationFn: updateWorkflowNodeConnApi,
	});

export const useUpdateNodesPositions = () =>
	useMutation({
		mutationFn: updateNodesPositionApi,
	});

export const useExecuteWorkflow = () => {
	const { createSSEConnection } = useSSE();
	const setShowExecutionUpdates = useWorkflowExecutionStore(
		(s) => s.setShowExecutionUpdates,
	);
	return useMutation({
		mutationFn: ({
			workflowId,
			triggerNodeId,
			triggerType,
			liveUpdates = true,
		}: { workflowId: string } & ExecuteWorkflowRequest) =>
			executeWorkflowApi(workflowId, {
				triggerNodeId,
				triggerType,
				liveUpdates,
			}),
		onSuccess: (data) => {
			toast.success("Workflow execution started");
			createSSEConnection(data.executionId);
			setShowExecutionUpdates(true);
		},
		onError: (error) => {
			toast.error(getErrorMessage(error));
		},
	});
};

export const useWorkflowLogs = (workflowId: string) => {
	return useInfiniteQuery({
		queryKey: ["workflow-logs", { workflowId }],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			workflowExecutionLogsApi(workflowId, pageParam),

		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) =>
			lastPage.hasNextPage ? allPages.length + 1 : undefined,
	});
};
