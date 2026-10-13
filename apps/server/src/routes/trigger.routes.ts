import { Router, raw } from "express";
import { triggerCallback } from "@/controllers/triggers.controller.js";
import { asyncHandler } from "@/utils/api.utils.js";

const router = Router() as Router;

router.all(
	"/:workflowId/:triggerNodeId",
	raw({ type: () => true, limit: "1mb", inflate: false }),
	asyncHandler(triggerCallback),
);

export default router;
