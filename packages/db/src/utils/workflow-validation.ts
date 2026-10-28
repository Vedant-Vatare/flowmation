import {
	credentialRegistry,
	type WorkflowConnection,
	type WorkflowNode,
} from "@nodebase/shared";
import {
	and,
	credentialsTable,
	db,
	eq,
	inArray,
	nodesTable,
	userWorkflowsTable,
	workflowNodesTable,
} from "../index.js";

type NodeDefinition = Pick<
	typeof nodesTable.$inferSelect,
	"id" | "task" | "type" | "credentialProvider"
>;
type Credential = Pick<
	typeof credentialsTable.$inferSelect,
	"id" | "provider" | "type"
>;

const validateCredentialSelection = (
	node: WorkflowNode,
	definition: NodeDefinition | undefined,
	credential: Credential | undefined,
	requireCredential: boolean,
) => {
	if (
		!definition ||
		definition.task !== node.task ||
		definition.type !== node.type
	) {
		throw new Error("Invalid node definition");
	}

	const provider = definition.credentialProvider;
	const operation =
		node.parameters.find((parameter) => parameter.name === "operation")
			?.value || "send_webhook";
	const conditional = node.task === "action.discord";
	const needsCredential =
		!!provider && (!conditional || operation === "send_dm");

	if (!node.credentialId) {
		if (requireCredential && needsCredential) {
			throw new Error(`Select a credential for node: ${node.name}`);
		}

		return;
	}

	const credentialDefinition = provider
		? credentialRegistry[provider]
		: undefined;
	const type =
		credentialDefinition?.type === "oauth2"
			? "oauth"
			: credentialDefinition?.type;

	if (
		!credential ||
		!provider ||
		credential.provider !== provider ||
		credential.type !== type
	) {
		throw new Error("Invalid credential selection");
	}
};

export const validateNodeCredential = async (
	node: WorkflowNode,
	userId: string,
) => {
	const [definition] = await db
		.select({
			id: nodesTable.id,
			task: nodesTable.task,
			type: nodesTable.type,
			credentialProvider: nodesTable.credentialProvider,
		})
		.from(nodesTable)
		.where(eq(nodesTable.id, node.nodeId));
	const credential = node.credentialId
		? (
				await db
					.select({
						id: credentialsTable.id,
						provider: credentialsTable.provider,
						type: credentialsTable.type,
					})
					.from(credentialsTable)
					.where(
						and(
							eq(credentialsTable.id, node.credentialId),
							eq(credentialsTable.userId, userId),
						),
					)
			)[0]
		: undefined;

	validateCredentialSelection(node, definition, credential, false);
};

const validateWorkflowNodes = async (
	workflowId: string,
	userId: string,
	nodes: WorkflowNode[],
) => {
	const [workflow] = await db
		.select({ id: userWorkflowsTable.id })
		.from(userWorkflowsTable)
		.where(
			and(
				eq(userWorkflowsTable.id, workflowId),
				eq(userWorkflowsTable.userId, userId),
			),
		);

	if (!workflow) throw new Error("Workflow not found");

	if (new Set(nodes.map((node) => node.id)).size !== nodes.length)
		throw new Error("Duplicate workflow node");

	if (nodes.some((node) => node.workflowId !== workflowId))
		throw new Error("Invalid workflow node");

	if (!nodes.length) return;

	const nodeIds = [...new Set(nodes.map((node) => node.nodeId))];
	const credentialIds = [
		...new Set(
			nodes.flatMap((node) => (node.credentialId ? [node.credentialId] : [])),
		),
	];
	const definitions = await db
		.select({
			id: nodesTable.id,
			task: nodesTable.task,
			type: nodesTable.type,
			credentialProvider: nodesTable.credentialProvider,
		})
		.from(nodesTable)
		.where(inArray(nodesTable.id, nodeIds));
	const credentials = credentialIds.length
		? await db
				.select({
					id: credentialsTable.id,
					provider: credentialsTable.provider,
					type: credentialsTable.type,
				})
				.from(credentialsTable)
				.where(
					and(
						inArray(credentialsTable.id, credentialIds),
						eq(credentialsTable.userId, userId),
					),
				)
		: [];
	const definitionsById = new Map(
		definitions.map((definition) => [definition.id, definition]),
	);
	const credentialsById = new Map(
		credentials.map((credential) => [credential.id, credential]),
	);

	for (const node of nodes) {
		validateCredentialSelection(
			node,
			definitionsById.get(node.nodeId),
			node.credentialId ? credentialsById.get(node.credentialId) : undefined,
			true,
		);
	}
};

export const validateWorkflowGraph = async (
	workflowId: string,
	userId: string,
	nodes: WorkflowNode[],
	connections: WorkflowConnection[],
) => {
	const nodesById = new Map(nodes.map((node) => [node.id, node]));

	for (const connection of connections) {
		const source = nodesById.get(connection.sourceId);
		const target = nodesById.get(connection.targetId);

		if (
			connection.workflowId !== workflowId ||
			!source ||
			!target ||
			!source.outputPorts.some((port) => port.name === connection.sourcePort) ||
			!target.inputPorts.some((port) => port.name === connection.targetPort)
		) {
			throw new Error("Invalid workflow connection");
		}
	}

	await validateWorkflowNodes(workflowId, userId, nodes);

	const members = await db
		.select({ id: workflowNodesTable.id })
		.from(workflowNodesTable)
		.where(eq(workflowNodesTable.workflowId, workflowId));
	const memberIds = new Set(members.map((node) => node.id));

	if (nodes.some((node) => !memberIds.has(node.id)))
		throw new Error("Invalid workflow node");
};

export const validateWorkflowExecution = async (
	workflowId: string,
	userId: string,
	nodes: WorkflowNode[],
	triggerNodeId: string,
) => {
	if (
		!nodes.some((node) => node.id === triggerNodeId && node.type === "trigger")
	) {
		throw new Error("Invalid workflow trigger");
	}

	await validateWorkflowNodes(workflowId, userId, nodes);
};
