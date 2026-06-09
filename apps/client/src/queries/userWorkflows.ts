import type {
	ExecuteWorkflowRequest,
	PartialWorkflowNode,
	UpdateUserWorkflow,
	UserWorkflow,
	WorkflowConnection,
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
import { useEffect } from "react";
import { toast } from "sonner";
import {
	addWorkflowNodeApi,
	addWorkflowNodeConnApi,
	createUserWorkflowApi,
	deleteWorkflowConnApi,
	deleteWorkflowNodeApi,
	executeWorkflowApi,
	executionLogs,
	getPublishStatusApi,
	getUserWorkflowsApi,
	getWorkflowConnections,
	getWorkflowNodes,
	publishWorkflowApi,
	unpublishWorkflowApi,
	updateNodesPositionApi,
	updateUserWorkflowApi,
	updateWorkflowNodeApi,
	updateWorkflowNodeConnApi,
	workflowExecutionLogsApi,
} from "@/apis/userWorkflow";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useDebounce } from "@/hooks/debounce";
import { initiateSSEConnection } from "@/services/sse";
import {
	usePublishStatusStore,
	useWorkflowExecutionStore,
} from "@/store/workflow/useWorkflowStore";
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
	const checkForStatusChanges = usePublishStatusStore(
		(s) => s.checkForStatusChanges,
	);
	const compareDraftChanges = useDebounce(
		(nodes: WorkflowNode[], connections: WorkflowConnection[]) =>
			checkForStatusChanges(nodes, connections),
		undefined,
		300,
	);
	return useMutation({
		mutationFn: (node: WorkflowNode) => addWorkflowNodeApi(node),
		onSuccess: (data, { workflowId }) => {
			queryClient.setQueryData(
				workflowNodesOptions(workflowId).queryKey,
				(old) => [...(old ?? []), data],
			);
			const nodes = queryClient.getQueryData<WorkflowNode[]>(
				workflowNodesOptions(workflowId).queryKey,
			);
			const connections = queryClient.getQueryData<WorkflowConnection[]>([
				"workflow-connections",
				{ workflowId },
			]);
			if (nodes && connections) compareDraftChanges(nodes, connections);
		},
	});
};

export const useDeleteWorkflowNode = () => {
	const queryClient = useQueryClient();
	const checkForStatusChanges = usePublishStatusStore(
		(s) => s.checkForStatusChanges,
	);
	const compareDraftChanges = useDebounce(
		(nodes: WorkflowNode[], connections: WorkflowConnection[]) =>
			checkForStatusChanges(nodes, connections),
		undefined,
		300,
	);
	return useMutation({
		mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) =>
			deleteWorkflowNodeApi(id, workflowId),
		onSuccess: (_, { id, workflowId }) => {
			queryClient.setQueryData(
				workflowNodesOptions(workflowId).queryKey,
				(old) => old?.filter((n) => n.id !== id),
			);
			const nodes = queryClient.getQueryData<WorkflowNode[]>(
				workflowNodesOptions(workflowId).queryKey,
			);
			const connections = queryClient.getQueryData<WorkflowConnection[]>([
				"workflow-connections",
				{ workflowId },
			]);
			if (nodes && connections) compareDraftChanges(nodes, connections);
		},
	});
};

export const useUpdateWorkflowNode = () => {
	const { setNodes } = useReactFlow<WorkflowCanvasNode>();
	const queryClient = useQueryClient();
	const checkForStatusChanges = usePublishStatusStore(
		(s) => s.checkForStatusChanges,
	);
	const compareDraftChanges = useDebounce(
		(nodes: WorkflowNode[], connections: WorkflowConnection[]) =>
			checkForStatusChanges(nodes, connections),
		undefined,
		300,
	);

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

			queryClient.setQueryData(
				workflowNodesOptions(variables.workflowId).queryKey,
				(old: WorkflowNode[] | undefined) =>
					old?.map((n) => (n.id === nodeId ? { ...n, ...nodeUpdates } : n)),
			);

			const nodes = queryClient.getQueryData<WorkflowNode[]>(
				workflowNodesOptions(variables.workflowId).queryKey,
			);
			const connections = queryClient.getQueryData<WorkflowConnection[]>([
				"workflow-connections",
				{ workflowId: variables.workflowId },
			]);
			if (nodes && connections) compareDraftChanges(nodes, connections);
		},
	});
};

export const useAddWorkflowConn = () => {
	const queryClient = useQueryClient();
	const checkForStatusChanges = usePublishStatusStore(
		(s) => s.checkForStatusChanges,
	);
	const compareDraftChanges = useDebounce(
		(nodes: WorkflowNode[], connections: WorkflowConnection[]) =>
			checkForStatusChanges(nodes, connections),
		undefined,
		300,
	);
	return useMutation({
		mutationFn: addWorkflowNodeConnApi,
		onSuccess: (data, variables) => {
			const workflowId = variables.workflowId;
			queryClient.setQueryData(
				["workflow-connections", { workflowId }],
				(old: WorkflowConnection[] | undefined) => [...(old ?? []), data],
			);
			const nodes = queryClient.getQueryData<WorkflowNode[]>(
				workflowNodesOptions(workflowId).queryKey,
			);
			const connections = queryClient.getQueryData<WorkflowConnection[]>([
				"workflow-connections",
				{ workflowId },
			]);
			if (nodes && connections) compareDraftChanges(nodes, connections);
		},
	});
};

export const useDeleteWorkflowConn = () => {
	const queryClient = useQueryClient();
	const checkForStatusChanges = usePublishStatusStore(
		(s) => s.checkForStatusChanges,
	);
	const compareDraftChanges = useDebounce(
		(nodes: WorkflowNode[], connections: WorkflowConnection[]) =>
			checkForStatusChanges(nodes, connections),
		undefined,
		300,
	);
	return useMutation({
		mutationFn: deleteWorkflowConnApi,
		onSuccess: (_, variables) => {
			const workflowId = variables.workflowId;
			queryClient.setQueryData(
				["workflow-connections", { workflowId }],
				(old: WorkflowConnection[] | undefined) =>
					old?.filter((c) => c.id !== variables.id),
			);
			const nodes = queryClient.getQueryData<WorkflowNode[]>(
				workflowNodesOptions(workflowId).queryKey,
			);
			const connections = queryClient.getQueryData<WorkflowConnection[]>([
				"workflow-connections",
				{ workflowId },
			]);
			if (nodes && connections) compareDraftChanges(nodes, connections);
		},
	});
};

export const useUpdateWorkflowConn = () => {
	const queryClient = useQueryClient();
	const checkForStatusChanges = usePublishStatusStore(
		(s) => s.checkForStatusChanges,
	);
	const compareDraftChanges = useDebounce(
		(nodes: WorkflowNode[], connections: WorkflowConnection[]) =>
			checkForStatusChanges(nodes, connections),
		undefined,
		300,
	);
	return useMutation({
		mutationFn: updateWorkflowNodeConnApi,
		onSuccess: (data, variables) => {
			const workflowId = variables.workflowId;
			queryClient.setQueryData(
				["workflow-connections", { workflowId }],
				(old: WorkflowConnection[] | undefined) =>
					old?.map((c) => (c.id === data.id ? data : c)),
			);
			const nodes = queryClient.getQueryData<WorkflowNode[]>(
				workflowNodesOptions(workflowId).queryKey,
			);
			const connections = queryClient.getQueryData<WorkflowConnection[]>([
				"workflow-connections",
				{ workflowId },
			]);
			if (nodes && connections) compareDraftChanges(nodes, connections);
		},
	});
};

export const useUpdateNodesPositions = () => {
	const queryClient = useQueryClient();
	const checkForStatusChanges = usePublishStatusStore(
		(s) => s.checkForStatusChanges,
	);
	const compareDraftChanges = useDebounce(
		(nodes: WorkflowNode[], connections: WorkflowConnection[]) =>
			checkForStatusChanges(nodes, connections),
		undefined,
		300,
	);
	return useMutation({
		mutationFn: updateNodesPositionApi,
		onSuccess: (_data, variables) => {
			const posMap = new Map(
				variables.nodes.map((n) => [
					n.id,
					{ positionX: n.positionX, positionY: n.positionY },
				]),
			);
			queryClient.setQueryData(
				workflowNodesOptions(variables.workflowId).queryKey,
				(old: WorkflowNode[] | undefined) =>
					old?.map((n) => {
						const pos = posMap.get(n.id);
						return pos ? { ...n, ...pos } : n;
					}),
			);
			const nodes = queryClient.getQueryData<WorkflowNode[]>(
				workflowNodesOptions(variables.workflowId).queryKey,
			);
			const connections = queryClient.getQueryData<WorkflowConnection[]>([
				"workflow-connections",
				{ workflowId: variables.workflowId },
			]);
			if (nodes && connections) compareDraftChanges(nodes, connections);
		},
	});
};

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

export const usePublishStatus = (workflowId: string) => {
	const setSnapshot = usePublishStatusStore((s) => s.setSnapshot);
	const result = useQuery({
		queryKey: ["publishStatus", { workflowId }],
		queryFn: () => getPublishStatusApi(workflowId),
		staleTime: Number.POSITIVE_INFINITY,
	});

	useEffect(() => {
		if (result.data) {
			setSnapshot(result.data.snapshotNodes, result.data.snapshotConnections);
		}
	}, [result.data, setSnapshot]);

	return result;
};

export const usePublishWorkflow = () => {
	const queryClient = useQueryClient();
	const reset = usePublishStatusStore((s) => s.reset);
	return useMutation({
		mutationFn: publishWorkflowApi,
		onSuccess: (_data, workflowId) => {
			queryClient.invalidateQueries({
				queryKey: ["publishStatus", { workflowId }],
			});
			queryClient.invalidateQueries({ queryKey: ["user-workflows"] });
			reset();
			toast.success("Workflow published");
		},
		onError: () => {
			toast.error("Failed to publish workflow");
		},
	});
};

export const useUnpublishWorkflow = () => {
	const queryClient = useQueryClient();
	const reset = usePublishStatusStore((s) => s.reset);
	return useMutation({
		mutationFn: unpublishWorkflowApi,
		onSuccess: (_data, workflowId) => {
			queryClient.invalidateQueries({
				queryKey: ["publishStatus", { workflowId }],
			});
			queryClient.invalidateQueries({ queryKey: ["user-workflows"] });
			reset();
			toast.success("Workflow unpublished");
		},
		onError: () => {
			toast.error("Failed to unpublish workflow");
		},
	});
};
