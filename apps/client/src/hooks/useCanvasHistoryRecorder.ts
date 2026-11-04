import type { WorkflowConnection, WorkflowNode } from "@nodebase/shared";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { workflowNodesOptions } from "@/queries/userWorkflows";
import {
	type CanvasSnapshot,
	useCanvasHistoryStore,
} from "@/store/workflow/useCanvasHistoryStore";

const getCanvasLayoutSignature = (snapshot: CanvasSnapshot) => {
	return JSON.stringify([
		snapshot.nodes
			.map(({ id, positionX, positionY }) => [id, positionX, positionY])
			.sort(),
		snapshot.edges
			.map(({ id, source, target, sourceHandle, targetHandle }) => [
				id,
				source,
				target,
				sourceHandle,
				targetHandle,
			])
			.sort(),
	]);
};

export const readCachedSnapshot = (
	queryClient: QueryClient,
	workflowId: string,
): CanvasSnapshot | undefined => {
	const nodesQueryKey = workflowNodesOptions(workflowId).queryKey;
	const connectionsQueryKey = ["workflow-connections", { workflowId }];
	const nodes = queryClient.getQueryData<WorkflowNode[]>(nodesQueryKey);

	const connections =
		queryClient.getQueryData<WorkflowConnection[]>(connectionsQueryKey);

	if (!nodes || !connections) return;

	return {
		nodes,
		edges: connections.map((edge) => ({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
			sourceHandle: edge.sourcePort,
			targetHandle: edge.targetPort,
		})),
	};
};

export const useCanvasHistoryRecorder = (workflowId: string) => {
	const queryClient = useQueryClient();

	useEffect(() => {
		const history = useCanvasHistoryStore.getState();
		const queryCache = queryClient.getQueryCache();
		const nodesQueryKey = workflowNodesOptions(workflowId).queryKey;
		const connectionsQueryKey = ["workflow-connections", { workflowId }];

		history.clear();
		let previousSnapshot = readCachedSnapshot(queryClient, workflowId);
		let hasPendingGraphUpdate = false;
		let shouldRecordHistory = true;
		let historyCheckTimer: ReturnType<typeof setTimeout> | undefined;

		const scheduleHistoryCheck = () => {
			clearTimeout(historyCheckTimer);
			historyCheckTimer = setTimeout(() => {
				if (!hasPendingGraphUpdate || queryClient.isMutating()) return;
				const currentSnapshot = readCachedSnapshot(queryClient, workflowId);
				if (
					previousSnapshot &&
					currentSnapshot &&
					getCanvasLayoutSignature(previousSnapshot) !==
						getCanvasLayoutSignature(currentSnapshot)
				) {
					if (shouldRecordHistory)
						history.pushSnapshot(structuredClone(previousSnapshot));
				}
				previousSnapshot = currentSnapshot;
				hasPendingGraphUpdate = false;
				history.setHistoryCheckPending(false);
				shouldRecordHistory = true;
			}, 0);
		};

		const unsubscribeQueryUpdates = queryCache.subscribe((event) => {
			if (event.type !== "updated" || event.action.type !== "success") return;
			const query = event.query;
			if (
				query !== queryCache.find({ queryKey: nodesQueryKey, exact: true }) &&
				query !==
					queryCache.find({ queryKey: connectionsQueryKey, exact: true })
			)
				return;

			hasPendingGraphUpdate = true;
			history.setHistoryCheckPending(true);
			shouldRecordHistory &&=
				!!event.action.manual &&
				useCanvasHistoryStore.getState().restoringWorkflowId !== workflowId;
			scheduleHistoryCheck();
		});
		const unsubscribeMutationUpdates = queryClient
			.getMutationCache()
			.subscribe(() => {
				if (hasPendingGraphUpdate) scheduleHistoryCheck();
			});
		return () => {
			clearTimeout(historyCheckTimer);
			unsubscribeQueryUpdates();
			unsubscribeMutationUpdates();
			history.setHistoryCheckPending(false);
		};
	}, [queryClient, workflowId]);
};
