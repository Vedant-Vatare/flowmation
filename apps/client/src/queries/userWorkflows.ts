import type {
	ExecuteWorkflowRequest,
	PartialWorkflowNode,
	WorkflowNode,
} from "@nodebase/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import {
	addWorkflowNodeApi,
	addWorkflowNodeConnApi,
	deleteWorkflowConnApi,
	deleteWorkflowNodeApi,
	executeWorkflowApi,
	getUserWorkflowsApi,
	getWorkflowConnections,
	getWorkflowNodes,
	updateNodesPositionApi,
	updateWorkflowNodeApi,
	updateWorkflowNodeConnApi,
} from "@/apis/userWorkflow";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useWorkflowStore } from "@/store/workflow/useWorkflowStore";
import { getErrorMessage } from "@/utils/error";

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

export const useUpdateWorkflowNode = () => {
	const { setNodes } = useReactFlow();
	const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

	return useMutation({
		mutationFn: (node: PartialWorkflowNode) => updateWorkflowNodeApi(node),
		onSuccess: (_, variables) => {
			if (!variables.parameters || !variables.id) return;

			const nodeId = variables.id;

			setNodes((nds) =>
				nds.map((n) =>
					n.id === nodeId
						? { ...n, data: { ...n.data, parameters: variables.parameters } }
						: n,
				),
			);

			const selectedNode = useWorkflowStore.getState().selectedNode;
			if (selectedNode?.id === nodeId) {
				setSelectedNode({
					...selectedNode,
					data: { ...selectedNode.data, parameters: variables.parameters },
				} as WorkflowCanvasNode);
			}
		},
	});
};

export const useAddWorkflowConn = () =>
	useMutation({
		mutationFn: addWorkflowNodeConnApi,
	});

export const useDeleteWorkflowConn = () =>
	useMutation({
		mutationFn: ({ id }: { id: string }) => deleteWorkflowConnApi(id),
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
		onSuccess: () => {
			toast.success("Workflow execution started");
		},
		onError: (error) => {
			toast.error(getErrorMessage(error));
		},
	});
};
