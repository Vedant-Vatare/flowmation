import type {
	ExecuteWorkflowRequest,
	PartialWorkflowNode,
	UpdateUserWorkflow,
	UserWorkflow,
	WorkflowNode,
} from "@nodebase/shared";
import {
	queryOptions,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import {
	addWorkflowNodeApi,
	addWorkflowNodeConnApi,
	createUserWorkflowApi,
	deleteWorkflowConnApi,
	deleteWorkflowNodeApi,
	executeWorkflowApi,
	executionLogs,
	getUserWorkflowsApi,
	getWorkflowConnections,
	getWorkflowNodes,
	updateNodesPositionApi,
	updateUserWorkflowApi,
	updateWorkflowNodeApi,
	updateWorkflowNodeConnApi,
	workflowExecutionLogsApi,
} from "@/apis/userWorkflow";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { initiateSSEConnection } from "@/services/sse";
import { useWorkflowExecutionStore } from "@/store/workflow/useWorkflowStore";
import { getErrorMessage } from "@/utils/error";

export const userWorkflowsOptions = () =>
	queryOptions({
		queryKey: ["user-workflows"],
		queryFn: getUserWorkflowsApi,
		staleTime: Number.POSITIVE_INFINITY,
	});

export const workflowNodesOptions = (workflowId: string) =>
	queryOptions({
		queryKey: ["workflow-nodes", { workflowId }],
		queryFn: () => getWorkflowNodes(workflowId),
		staleTime: Number.POSITIVE_INFINITY,
	});

export const useCreateUserWorkflowQuery = () =>
	useMutation({
		mutationFn: createUserWorkflowApi,
		onSuccess: () => {},
	});

export const useUserWorkflowQuery = () => useQuery(userWorkflowsOptions());

export const useWorkflowNodesQuery = (workflowId: string) =>
	useQuery(workflowNodesOptions(workflowId));

export const useWorkflowConnectionsQuery = (workflowId: string) =>
	useQuery({
		queryKey: ["workflow-connections", { workflowId }],
		queryFn: () => getWorkflowConnections(workflowId),
		staleTime: Number.POSITIVE_INFINITY,
	});

export const useAddWorkflowNode = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (node: WorkflowNode) => addWorkflowNodeApi(node),
		onSuccess: (data, { workflowId }) =>
			queryClient.setQueryData(
				workflowNodesOptions(workflowId).queryKey,
				(old) => [...(old ?? []), data],
			),
	});
};

export const useDeleteWorkflowNode = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) =>
			deleteWorkflowNodeApi(id, workflowId),
		onSuccess: (_, { id, workflowId }) => {
			queryClient.setQueryData(
				workflowNodesOptions(workflowId).queryKey,
				(old) => old?.filter((n) => n.id !== id),
			);
		},
	});
};

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
		onSuccess: (data, variables) => {
			if (!variables.node.id) return;

			const { id: nodeId, ...nodeUpdates } = data;

			setNodes((nds) =>
				nds.map((n) => {
					if (n.id !== nodeId) return n;
					return { ...n, data: { ...n.data, ...nodeUpdates } };
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

export const useUpdateUserWorkflow = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			workflowId,
			data,
		}: {
			workflowId: string;
			data: UpdateUserWorkflow;
		}) => updateUserWorkflowApi(workflowId, data),
		onSuccess: (data, { workflowId }) => {
			queryClient.setQueryData(
				userWorkflowsOptions().queryKey,
				(old: UserWorkflow[] | undefined) =>
					old?.map((w) => (w.id === workflowId ? data : w)),
			);
		},
	});
};

export const useExecuteWorkflow = () => {
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
			initiateSSEConnection(data.executionId);
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

export const useExecutionLogs = () => {
	return useInfiniteQuery({
		queryKey: ["execution-logs"],
		queryFn: ({ pageParam }: { pageParam: number }) => executionLogs(pageParam),

		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) =>
			lastPage.hasNextPage ? allPages.length + 1 : undefined,
	});
};
