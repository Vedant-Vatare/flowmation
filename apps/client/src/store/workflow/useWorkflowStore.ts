import type {
	NodeExecutionUpdate,
	WorkflowConnection,
	WorkflowNode,
} from "@nodebase/shared";
import { create } from "zustand";

type WorkflowStore = {
	nodeConfigurationIssues: Record<string, string[]>;
	setNodeConfigurationIssues: (nodeId: string, issues: string[]) => void;
	selectedNodeId: string | null;
	setSelectedNodeId: (nodeId: string | null) => void;
	nodeDrafts: Record<string, Record<string, unknown>>;
	setNodeDraft: (nodeId: string, values: Record<string, unknown>) => void;
	clearNodeDraft: (
		nodeId: string,
		savedValues?: Record<string, unknown>,
	) => void;
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

export type NodeExectionWithTime = NodeExecutionUpdate & {
	nodeExecutionId: string;
	startedAt: Date;
};

type WorkflowExecutionStore = {
	showLiveExecutionPanel: boolean;
	setLiveExecutionPanel: (state: boolean) => void;
	showExecutionUpdates: boolean;
	setShowExecutionUpdates: (state: boolean) => void;
	nodeExecutionUpdates: Record<string, NodeExectionWithTime>;
	nodeExecutionHistory: NodeExectionWithTime[];
	addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) => void;
	clearExecutionUpdates: () => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
	nodeConfigurationIssues: {},
	setNodeConfigurationIssues: (nodeId, issues) =>
		set((state) => {
			if (
				JSON.stringify(state.nodeConfigurationIssues[nodeId] ?? []) ===
				JSON.stringify(issues)
			)
				return state;
			return {
				nodeConfigurationIssues: {
					...state.nodeConfigurationIssues,
					[nodeId]: issues,
				},
			};
		}),
	selectedNodeId: null,
	setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
	nodeDrafts: {},
	setNodeDraft: (nodeId, values) =>
		set((state) => ({ nodeDrafts: { ...state.nodeDrafts, [nodeId]: values } })),
	clearNodeDraft: (nodeId, savedValues) =>
		set((state) => {
			if (savedValues && state.nodeDrafts[nodeId] !== savedValues) return state;
			const { [nodeId]: _draft, ...nodeDrafts } = state.nodeDrafts;
			return { nodeDrafts };
		}),
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
		nodeExecutionHistory: [],
		addNodeExecutionUpdate: (executionUpdate: NodeExecutionUpdate) =>
			set((state) => {
				const latest =
					state.nodeExecutionUpdates[executionUpdate.workflowNodeId];

				let nodeExecutionId = executionUpdate.nodeExecutionId;
				if (nodeExecutionId == null) {
					if (
						executionUpdate.type !== "node:started" &&
						latest?.type === "node:started"
					) {
						nodeExecutionId = latest.nodeExecutionId;
					} else {
						nodeExecutionId = crypto.randomUUID();
					}
				}

				const index = state.nodeExecutionHistory.findIndex(
					(entry) => entry.nodeExecutionId === nodeExecutionId,
				);
				const existing = state.nodeExecutionHistory[index];
				let startedAt = existing?.startedAt;
				if (startedAt == null) {
					if (executionUpdate.type === "node:started") {
						startedAt = executionUpdate.startedAt;
					} else {
						startedAt = executionUpdate.completedAt;
					}
				}

				const update: NodeExectionWithTime = {
					...executionUpdate,
					nodeExecutionId,
					startedAt,
				};

				const nodeExecutionHistory = [...state.nodeExecutionHistory];
				if (index === -1) nodeExecutionHistory.push(update);
				else nodeExecutionHistory[index] = update;

				return {
					nodeExecutionUpdates: {
						...state.nodeExecutionUpdates,
						[executionUpdate.workflowNodeId]: update,
					},
					nodeExecutionHistory,
				};
			}),

		clearExecutionUpdates: () => {
			set({
				showExecutionUpdates: false,
				nodeExecutionUpdates: {},
				nodeExecutionHistory: [],
			});
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
