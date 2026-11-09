import { Router, type Router as RouterType } from "express";
import {
	decideHumanReview,
	getExecutionLogs,
	getLatestWorkflowNodeOutputs,
	getPendingHumanReviews,
	getWorkflowLogs,
} from "@/controllers/worflow.executions.js";
import { asyncHandler } from "@/utils/api.utils.js";
import { authenticateUser } from "@/utils/auth.utils.js";

const router = Router() as RouterType;

router.use(authenticateUser);

router.get("/logs", asyncHandler(getExecutionLogs));
router.get("/reviews", asyncHandler(getPendingHumanReviews));
router.post("/:executionId/reviews/:reviewId", asyncHandler(decideHumanReview));

router.get(
	"/:workflowId/nodes/latest",
	asyncHandler(getLatestWorkflowNodeOutputs),
);

router.get("/:workflowId", asyncHandler(getWorkflowLogs));

export default router;
