import type { MongodbNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const parseJson = (value: string | undefined, paramName: string): unknown => {
	if (!value || !value.trim()) return undefined;
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`Invalid JSON in ${paramName}: ${value}`);
	}
};

const convertObjectIds = (
	obj: Record<string, unknown>,
	ObjectId: new (id: string) => unknown,
): Record<string, unknown> => {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (key === "_id" && typeof value === "string") {
			result[key] = new ObjectId(value);
		} else if (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value)
		) {
			result[key] = convertObjectIds(
				value as Record<string, unknown>,
				ObjectId,
			);
		} else {
			result[key] = value;
		}
	}
	return result;
};

export const mongodbNodeExecutor = async (
	node: MongodbNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for MongoDB node",
		};
	}

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (
			credential.type !== "database" ||
			!credential.fields?.connectionString
		) {
			return {
				success: false,
				message: "Invalid credential format for MongoDB",
			};
		}

		const connectionString = credential.fields.connectionString;

		const params = await getResolvedParams(node, executionId);
		const operation = params.operation?.value as string;
		const database = params.database?.value as string;
		const collection = params.collection?.value as string;

		if (!operation) return { success: false, message: "Operation is required" };
		if (!database) return { success: false, message: "Database is required" };
		if (!collection)
			return { success: false, message: "Collection is required" };

		const filter = parseJson(params.filter?.value as string, "filter");
		const document = parseJson(params.document?.value as string, "document");
		const update = parseJson(params.update?.value as string, "update");
		const projection = parseJson(
			params.projection?.value as string,
			"projection",
		);

		const { MongoClient, ObjectId } = await import("mongodb");
		const client = new MongoClient(connectionString);

		await client.connect();

		try {
			const db = client.db(database);
			const col = db.collection(collection);

			const filterWithIds =
				filter && typeof filter === "object" && "_id" in filter
					? convertObjectIds(filter as Record<string, unknown>, ObjectId)
					: filter;

			let result: unknown;

			switch (operation) {
				case "find": {
					const cursor = col.find(
						(filterWithIds as Record<string, unknown>) ?? {},
						projection ? { projection } : undefined,
					);
					result = await cursor.toArray();
					break;
				}
				case "findOne": {
					result = await col.findOne(
						(filterWithIds as Record<string, unknown>) ?? {},
						projection ? { projection } : undefined,
					);
					break;
				}
				case "insertOne": {
					if (!document)
						return {
							success: false,
							message: "Document is required for insertOne",
						};
					result = await col.insertOne(document);
					break;
				}
				case "insertMany": {
					if (!document)
						return {
							success: false,
							message: "Document (array) is required for insertMany",
						};
					const docs = Array.isArray(document) ? document : [document];
					result = await col.insertMany(docs);
					break;
				}
				case "updateOne": {
					if (!filter)
						return {
							success: false,
							message: "Filter is required for updateOne",
						};
					if (!update)
						return {
							success: false,
							message: "Update is required for updateOne",
						};
					result = await col.updateOne(
						filterWithIds as Record<string, unknown>,
						update,
					);
					break;
				}
				case "updateMany": {
					if (!filter)
						return {
							success: false,
							message: "Filter is required for updateMany",
						};
					if (!update)
						return {
							success: false,
							message: "Update is required for updateMany",
						};
					result = await col.updateMany(
						filterWithIds as Record<string, unknown>,
						update,
					);
					break;
				}
				case "deleteOne": {
					if (!filter)
						return {
							success: false,
							message: "Filter is required for deleteOne",
						};
					result = await col.deleteOne(
						filterWithIds as Record<string, unknown>,
					);
					break;
				}
				case "deleteMany": {
					if (!filter)
						return {
							success: false,
							message: "Filter is required for deleteMany",
						};
					result = await col.deleteMany(
						filterWithIds as Record<string, unknown>,
					);
					break;
				}
				default:
					return {
						success: false,
						message: `Unsupported operation: ${operation}`,
					};
			}

			return { success: true, output: result, status: "completed" };
		} finally {
			await client.close();
		}
	} catch (err) {
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in MongoDB node",
		};
	}
};
