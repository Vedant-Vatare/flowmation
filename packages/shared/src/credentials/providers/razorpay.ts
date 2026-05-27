import type { ApiKeyCredentialDef } from "../types.js";

export const razorpayCredential: ApiKeyCredentialDef = {
	type: "apiKey",
	name: "razorpay",
	displayName: "Razorpay",
	icon: "razorpay",
	fields: [
		{
			key: "keyId",
			label: "Key ID",
			placeholder: "rzp_live_...",
			secret: false,
		},
		{
			key: "keySecret",
			label: "Key Secret",
			placeholder: "Enter your key secret",
			secret: true,
		},
	],
};
