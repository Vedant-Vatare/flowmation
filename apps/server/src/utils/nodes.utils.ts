import {
	nodeSchemaRegistry,
	type PartialWorkflowNode,
	workflowNodeSchema,
} from "@nodebase/shared";
import type { NextFunction, Request, Response } from "express";
import { flattenError } from "zod";

type NodeValidationResult =
	| { success: true; data: Record<string, unknown> }
	| {
			success: false;
			error: {
				fieldErrors: Record<string, string[] | undefined>;
				formErrors: string[];
			};
	  };

type NodeValidationOptions = {
	partial?: boolean;
};

export const validateNodeSchema = (
	node: unknown,
	options: NodeValidationOptions = {},
): NodeValidationResult => {
	if (!node || typeof node !== "object") {
		throw new Error("Node data must be an object");
	}

	const nodeData = node as { task?: string };

	if (!nodeData.task) {
		throw new Error("Missing 'task' field in node data");
	}

	const schema = nodeSchemaRegistry.get(nodeData.task);

	if (!schema) {
		throw new Error(`No schema found for task: ${nodeData.task}`);
	}
	const fullNodeSchema = workflowNodeSchema.extend(schema.shape);

	const validationSchema = options.partial
		? fullNodeSchema.partial()
		: fullNodeSchema;

	const zodResult = validationSchema.safeParse(node);

	if (!zodResult.success) {
		return { success: false, error: flattenError(zodResult.error) };
	}

	return { success: true, data: zodResult.data };
};

export const validateNodeMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const validationResult = validateNodeSchema(req.body.node);

	if (validationResult.success) {
		req.body.node = validationResult.data;
		next();
	} else {
		return res.status(400).json({
			error: "ValidationError",
			message: "Invalid data",
			errors: validationResult.error,
		});
	}
};
export const validatePartialNodeMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const validationResult = validateNodeSchema(req.body.node, { partial: true });
	if (validationResult.success) {
		req.body.validatedNode = validationResult.data as PartialWorkflowNode;
		next();
	} else {
		return res.status(400).json({
			error: "ValidationError",
			message: "Invalid data",
			errors: validationResult.error,
		});
	}
};
