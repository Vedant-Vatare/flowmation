import { Router, type Router as RouterType } from "express";
import {
	getExecutionLogs,
	getWorkflowLogs,
} from "@/controllers/worflow.executions.js";
import { authenticateUser } from "@/utils/auth.utils.js";

const router = Router() as RouterType;

router.use(authenticateUser);

router.get("/logs", getExecutionLogs);

router.get("/:workflowId", getWorkflowLogs);

export default router;
