import { Router } from "express";
import { webhook } from "@/controllers/webhooks.controller.js";
import { asyncHandler } from "@/utils/api.utils.js";

const router = Router() as Router;

router.post("/:webhookId", asyncHandler(webhook));

export default router;
