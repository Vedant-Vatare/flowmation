import {
	createWorkflowSchema,
	executeWorkflowSchema,
	updateWorkflowSchema,
} from "@nodebase/shared";
import { Router, type Router as RouterType } from "express";
import { executeWorkflow } from "@/controllers/worflow.executions.js";
import {
	createWorkflow,
	getAllUserWorkflow,
	getPublishStatus,
	getUserWorkflow,
	publishWorkflow,
	unpublishWorkflow,
	updateUserWorkflow,
} from "@/controllers/workflow.controller.js";
import { asyncHandler, validateRequest } from "@/utils/api.utils.js";
import { authenticateUser } from "@/utils/auth.utils.js";

const router = Router() as RouterType;

router.use(authenticateUser);

router.post(
	"/new",
	validateRequest(createWorkflowSchema, "body"),
	createWorkflow,
);
router.post(
	"/run/:id",
	validateRequest(executeWorkflowSchema, "body"),
	asyncHandler(executeWorkflow),
);
router.patch(
	"/:id",
	validateRequest(updateWorkflowSchema, "body"),
	updateUserWorkflow,
);
router.get("/all", getAllUserWorkflow);
router.get("/:id", getUserWorkflow);
router.post("/:id/publish", asyncHandler(publishWorkflow));
router.post("/:id/unpublish", asyncHandler(unpublishWorkflow));
router.get("/:id/publish-status", asyncHandler(getPublishStatus));

export default router;
