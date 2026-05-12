import { Router } from "express";
import {
	registerTestWebhook,
	webhook,
} from "@/controllers/webhooks.controller.js";
import { asyncHandler } from "@/utils/api.utils.js";

const router = Router() as Router;

router.post("/test/register/:webhookId", asyncHandler(registerTestWebhook));

router.post("/:webhookId", asyncHandler(webhook));

export default router;
