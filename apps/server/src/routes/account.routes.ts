import { Router } from "express";
import {
	deletePasskey,
	getAccount,
	updateAccount,
} from "@/controllers/account.controller.js";
import { connectAccountGoogle } from "@/controllers/auth.controller.js";
import { asyncHandler } from "@/utils/api.utils.js";
import { authenticateUser } from "@/utils/auth.utils.js";

const router: Router = Router();
router.use(authenticateUser);
router.get("/", asyncHandler(getAccount));
router.patch("/", asyncHandler(updateAccount));
router.post("/google", asyncHandler(connectAccountGoogle));
router.delete("/passkeys/:id", asyncHandler(deletePasskey));
export default router;
