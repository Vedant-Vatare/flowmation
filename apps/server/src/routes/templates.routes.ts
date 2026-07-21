import { newTemplateSchema } from "@nodebase/shared";
import { Router } from "express";
import {
	addTemplate,
	getAllTemplates,
	updateTemplate,
} from "@/controllers/templates.controller.js";
import { asyncHandler, validateRequest } from "@/utils/api.utils.js";
import { authenticateAdminUser } from "@/utils/auth.utils.js";

const router = Router() as Router;

router.get("/all", getAllTemplates);

router.use(authenticateAdminUser);

router.post(
	"/new",
	validateRequest(newTemplateSchema, "body"),
	asyncHandler(addTemplate),
);

router.patch(
	"/",
	validateRequest(newTemplateSchema.partial(), "body"),
	asyncHandler(updateTemplate),
);

export default router;
