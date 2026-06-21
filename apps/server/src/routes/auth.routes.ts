import { Router, type Router as routerType } from "express";
import {
	generatePasskeyRegistration,
	getCurrentUser,
	googleCallback,
	googleLogin,
	logout,
	passkeyInitiate,
	passkeyVerify,
	verifyPasskeyRegistration,
} from "@/controllers/auth.controller.js";
import { asyncHandler } from "@/utils/api.utils.js";
import { authenticateUser } from "@/utils/auth.utils.js";

const router = Router() as routerType;

router.get("/me", authenticateUser, asyncHandler(getCurrentUser));
router.get("/google", asyncHandler(googleLogin));
router.get("/google/callback", asyncHandler(googleCallback));
router.post("/logout", asyncHandler(logout));

router.post("/passkey/initiate", asyncHandler(passkeyInitiate));
router.post("/passkey/verify", asyncHandler(passkeyVerify));

router.post(
	"/passkey/generate-registration",
	authenticateUser,
	asyncHandler(generatePasskeyRegistration),
);
router.post(
	"/passkey/verify-registration",
	authenticateUser,
	asyncHandler(verifyPasskeyRegistration),
);

export default router;
