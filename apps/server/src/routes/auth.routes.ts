import { Router, type Router as routerType } from "express";
import { googleCallback, googleLogin } from "@/controllers/auth.controller.js";
import { asyncHandler } from "@/utils/api.utils.js";

const router = Router() as routerType;

router.get("/google", asyncHandler(googleLogin));
router.get("/google/callback", asyncHandler(googleCallback));

export default router;
