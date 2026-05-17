import { Router, type Router as routerType } from "express";
import {
	connectOAuth,
	getCredentials,
	oauthCallback,
	saveApiKey,
} from "@/controllers/credentials.controller.js";
import { asyncHandler } from "@/utils/api.utils.js";
import { authenticateUser } from "@/utils/auth.utils.js";

const router = Router() as routerType;

router.get("/oauth/:provider/callback", asyncHandler(oauthCallback));

router.use(authenticateUser);

router.get("/", asyncHandler(getCredentials));
router.get("/oauth/:provider/connect", asyncHandler(connectOAuth));
router.post("/:provider", asyncHandler(saveApiKey));

export default router;
