import { baseNodeSchema, updateBaseNodeSchema } from "@nodebase/shared";
import { Router, type Router as routerType } from "express";
import {
	createNode,
	deleteNode,
	getAllNodes,
	updateNode,
} from "@/controllers/node.controller.js";
import { asyncHandler, validateRequest } from "@/utils/api.utils.js";

const router = Router() as routerType;

router.post(
	"/add",
	validateRequest(baseNodeSchema, "body"),
	asyncHandler(createNode),
);
router.get("/all", asyncHandler(getAllNodes));
router.patch(
	"/:id",
	validateRequest(updateBaseNodeSchema, "body"),
	asyncHandler(updateNode),
);
router.delete("/:id", asyncHandler(deleteNode));

export default router;
