import { NodeIdsWithPositionSchema } from "@nodebase/shared";
import { Router, type Router as RouterType } from "express";
import {
	addNodeInWorkflow,
	deleteNodeInWorkflow,
	getNodesInWorkflow,
	updateNodeInWorkflow,
	updateNodesPositions,
} from "@/controllers/workflow.nodes.controller.js";
import { asyncHandler, validateRequest } from "@/utils/api.utils.js";
import { authenticateUser } from "@/utils/auth.utils.js";
import {
	validateNodeSchema,
	validatePartialNodeMiddleware,
} from "@/utils/nodes.utils.js";

const router = Router() as RouterType;

router.use(authenticateUser);

router.post(
	"/",
	(req, res, next) => {
		const result = validateNodeSchema(req.body.node, {
			skipParamValues: true,
		});
		if (result.success) {
			req.body.node = result.data;
			next();
		} else {
			return res.status(400).json({
				error: "ValidationError",
				message: "Invalid data",
				errors: result.error,
			});
		}
	},
	asyncHandler(addNodeInWorkflow),
);
router.get("/:workflowId", asyncHandler(getNodesInWorkflow));
router.patch(
	"/:workflowId",
	validatePartialNodeMiddleware,
	asyncHandler(updateNodeInWorkflow),
);
router.patch(
	"/:workflowId/positions",
	validateRequest(NodeIdsWithPositionSchema, "body", {
		key: "nodes",
	}),
	updateNodesPositions,
);
router.delete("/", asyncHandler(deleteNodeInWorkflow));

export default router;
