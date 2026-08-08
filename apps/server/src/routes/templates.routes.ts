import {
	newTemplateSchema,
	templateDataSchema,
	updateTemplateSchema,
} from "@nodebase/shared";
import { Router } from "express";
import {
	addTemplate,
	addTemplateData,
	deleteTemplate,
	getAllTemplates,
	getTemplateData,
	updateTemplate,
	updateTemplateData,
} from "@/controllers/templates.controller.js";
import { asyncHandler, validateRequest } from "@/utils/api.utils.js";
import { authenticateAdminUser } from "@/utils/auth.utils.js";

const router = Router() as Router;

router.get("/all", getAllTemplates);
router.get("/:id/data", asyncHandler(getTemplateData));

router.use(authenticateAdminUser);

router.post(
	"/new",
	validateRequest(newTemplateSchema, "body"),
	asyncHandler(addTemplate),
);

router.post(
	"/data",
	validateRequest(templateDataSchema, "body"),
	asyncHandler(addTemplateData),
);

router.patch(
	"/data",
	validateRequest(templateDataSchema, "body"),
	asyncHandler(updateTemplateData),
);

router.patch(
	"/:id",
	validateRequest(updateTemplateSchema, "body"),
	asyncHandler(updateTemplate),
);

router.delete("/:id", asyncHandler(deleteTemplate));

export default router;
