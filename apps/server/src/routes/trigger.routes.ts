import { Router, raw } from "express";
import { triggerCallback } from "@/controllers/triggers.controller.js";
import { gmailPushCallback } from "@/triggers/gmail-webhook.js";
import { googleCalendarPushCallback } from "@/triggers/google-calendar-webhook.js";
import { asyncHandler } from "@/utils/api.utils.js";

const router = Router() as Router;

router.post(
	"/gmail/push",
	raw({ type: "application/json", limit: "16kb", inflate: false }),
	asyncHandler(gmailPushCallback),
);

router.post(
	"/google-calendar/push",
	raw({ type: () => true, limit: "16kb", inflate: false }),
	asyncHandler(googleCalendarPushCallback),
);

router.all(
	"/:workflowId/:triggerNodeId",
	raw({ type: () => true, limit: "1mb", inflate: false }),
	asyncHandler(triggerCallback),
);

export default router;
