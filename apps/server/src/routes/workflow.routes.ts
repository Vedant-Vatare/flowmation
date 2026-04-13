import { createWorkflowSchema, executeWorkflowSchema } from "@nodebase/shared";
import { Router, type Router as RouterType } from "express";
import {
	createWorkflow,
	executeWorkflow,
	getAllUserWorkflow,
	getUserWorkflow,
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
router.get("/all", getAllUserWorkflow);
router.get("/:id", getUserWorkflow);

export default router;
