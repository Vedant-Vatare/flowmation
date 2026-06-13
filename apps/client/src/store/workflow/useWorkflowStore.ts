import type {
	NodeExecutionUpdate,
	WorkflowConnection,
	WorkflowNode,
} from "@nodebase/shared";
import { create } from "zustand";
import type { WorkflowCanvasNode } from "@/constants/nodes";

type WorkflowStore = {
	selectedNode: WorkflowCanvasNode | null;
	setSelectedNode: (node: WorkflowCanvasNode | null) => void;
};

type TestWebhookData = { isActive: boolean; webhookId: string | null };
type WebhookStore = {
	testWebhook: TestWebhookData;
	setTestWebhook: (state: TestWebhookData) => void;
	clearTestWebhook: () => void;
};

type WorkflowTriggerStore = {
	isSelectingTrigger: boolean;
	setIsSelectingTrigger: (value: boolean) => void;
	triggerFocusRequestKey: number;
	requestTriggerFocus: () => void;
};

// preserving the startedAt field instead of replacing when type is node:completed
export type NodeExectionWithTime =
	| {
			type: "node:started";
			workflowNodeId: string;
			task: string;
			startedAt: Date;
	  }
	| {
			type: "node:completed";
			workflowNodeId: string;
			task: string;
			output: unknown;
			startedAt: Date;
			completedAt: Date;
	  }
	| {
			type: "node:failed";
			workflowNodeId: string;
			task: string;
			error: string;
			startedAt: Date;
	  };

type WorkflowExecutionStore = {
	showLiveExecutionPanel: boolean;
	setLiveExecutionPanel: (state: boolean) => void;
	showExecutionUpdates: boolean;
	setShowExecutionUpdates: (state: boolean) => void;
	nodeExecutionUpdates: Record<string, NodeExectionWithTime>;
	addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) => void;
	clearExecutionUpdates: () => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
	selectedNode: null,
	setSelectedNode: (node) => set({ selectedNode: node }),
}));

export const useWebhookStore = create<WebhookStore>((set) => ({
	testWebhook: { isActive: false, webhookId: null },
	setTestWebhook: (state) => set({ testWebhook: state }),
	clearTestWebhook: () =>
		set({ testWebhook: { isActive: false, webhookId: null } }),
}));

export const useWorkflowTriggerStore = create<WorkflowTriggerStore>((set) => ({
	isSelectingTrigger: false,
	setIsSelectingTrigger: (value) => set({ isSelectingTrigger: value }),

	triggerFocusRequestKey: 0,
	requestTriggerFocus: () =>
		set((state) => ({
			triggerFocusRequestKey: state.triggerFocusRequestKey + 1,
		})),
}));

export const useWorkflowExecutionStore = create<WorkflowExecutionStore>(
	(set) => ({
		showLiveExecutionPanel: false,
		setLiveExecutionPanel: (state) => set({ showLiveExecutionPanel: state }),
		showExecutionUpdates: false,
		setShowExecutionUpdates: (state: boolean) =>
			set({ showExecutionUpdates: state }),

		nodeExecutionUpdates: {},
		addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) =>
			set((state) => {
				const existing =
					state.nodeExecutionUpdates[executionUpdate.workflowNodeId];

				// get startedAt value from existing update or from current update
				const startedAt =
					existing?.type === "node:started"
						? existing.startedAt
						: executionUpdate.type === "node:started"
							? executionUpdate.startedAt
							: undefined;

				return {
					nodeExecutionUpdates: {
						...state.nodeExecutionUpdates,
						[executionUpdate.workflowNodeId]: {
							...executionUpdate,
							...(startedAt ? { startedAt } : {}),
						} as NodeExectionWithTime,
					},
				};
			}),

		clearExecutionUpdates: () => {
			set({ showExecutionUpdates: false, nodeExecutionUpdates: {} });
		},
	}),
);

type PublishStatusStore = {
	snapshotNodes: WorkflowNode[] | null;
	snapshotConnections: WorkflowConnection[] | null;
	hasDraftChanges: boolean;
	snapshotDataId: string | null;
	setSnapshot: (
		nodes: WorkflowNode[] | null,
		connections: WorkflowConnection[] | null,
	) => void;
	checkForStatusChanges: (
		currentNodes: WorkflowNode[],
		currentConnections: WorkflowConnection[],
	) => void;
	reset: () => void;
};

const normalizeNodes = (nodes: WorkflowNode[]) =>
	nodes
		.map((n) => ({
			id: n.id,
			nodeId: n.nodeId,
			positionX: n.positionX,
			positionY: n.positionY,
			name: n.name,
			type: n.type,
			task: n.task,
			description: n.description,
			credentialId: n.credentialId,
			settings: n.settings,
			parameters: n.parameters,
			outputPorts: n.outputPorts,
			inputPorts: n.inputPorts,
		}))
		.sort((a, b) => a.id.localeCompare(b.id));

const normalizeConnections = (conns: WorkflowConnection[]) =>
	conns
		.map((c) => ({
			sourceId: c.sourceId,
			targetId: c.targetId,
			sourcePort: c.sourcePort,
			targetPort: c.targetPort,
		}))
		.sort((a, b) => {
			const cmp = a.sourceId.localeCompare(b.sourceId);
			if (cmp !== 0) return cmp;
			return a.targetId.localeCompare(b.targetId);
		});

export const usePublishStatusStore = create<PublishStatusStore>((set) => ({
	snapshotNodes: null,
	snapshotConnections: null,
	hasDraftChanges: false,
			snapshotDataId: null,

	setSnapshot: (nodes, connections) =>
		set((state) => {
			const dataId = JSON.stringify({
				n: normalizeNodes(nodes ?? []),
				c: normalizeConnections(connections ?? []),
			});

			if (dataId === state.snapshotDataId) {
				return {};
			}

			return {
				snapshotNodes: nodes,
				snapshotConnections: connections,
				hasDraftChanges: false,
				snapshotDataId: dataId,
			};
		}),

	checkForStatusChanges: (currentNodes, currentConnections) =>
		set((state) => {
			if (!state.snapshotNodes || !state.snapshotConnections) {
				return { hasDraftChanges: false };
			}

			const currentNodesStr = JSON.stringify(normalizeNodes(currentNodes));
			const snapshotNodesStr = JSON.stringify(
				normalizeNodes(state.snapshotNodes),
			);
			const currentConnsStr = JSON.stringify(
				normalizeConnections(currentConnections),
			);
			const snapshotConnsStr = JSON.stringify(
				normalizeConnections(state.snapshotConnections),
			);

			return {
				hasDraftChanges:
					currentNodesStr !== snapshotNodesStr ||
					currentConnsStr !== snapshotConnsStr,
			};
		}),

	reset: () =>
		set({
			snapshotNodes: null,
			snapshotConnections: null,
			hasDraftChanges: false,
	snapshotDataId: null,
		}),
}));
