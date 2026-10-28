import { credentialRegistry, type WorkflowNode } from "@nodebase/shared";
import { and, credentialsTable, db, eq, nodesTable } from "../index.js";

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
) => {
	if (
		!definition ||
		definition.task !== node.task ||
		definition.type !== node.type
	) {
		throw new Error("Invalid node definition");
	}

	const provider = definition.credentialProvider;

	if (!node.credentialId) return;

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

	validateCredentialSelection(node, definition, credential);
};
