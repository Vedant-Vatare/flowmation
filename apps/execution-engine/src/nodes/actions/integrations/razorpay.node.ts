import type { RazorpayNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

const toErrorMessage = (err: unknown): string => {
	if (typeof err === "string") return err;
	if (
		err &&
		typeof err === "object" &&
		"message" in err &&
		typeof err.message === "string"
	)
		return err.message;
	if (err && typeof err === "object" && "error" in err) {
		const e = err.error;
		if (typeof e === "string") return e;
		if (e && typeof e === "object" && "description" in e && typeof e.description === "string")
			return e.description;
	}
	return JSON.stringify(err);
};

const basicAuth = (keyId: string, keySecret: string): string => {
	const encoded = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
	return `Basic ${encoded}`;
};

const callRazorpayApi = async (
	path: string,
	keyId: string,
	keySecret: string,
	options: RequestInit = {},
) => {
	const response = await fetch(`${RAZORPAY_BASE}${path}`, {
		...options,
		headers: {
			Authorization: basicAuth(keyId, keySecret),
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	let data: unknown;
	try {
		data = await response.json();
	} catch {
		return {
			success: false,
			message: `Razorpay API error: ${response.status}`,
		};
	}

	if (!response.ok) {
		const message = toErrorMessage(data) || `Razorpay API error: ${response.status}`;
		return { success: false, message };
	}

	return { success: true, data };
};

export const razorpayNodeExecutor = async (
	node: RazorpayNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return {
			success: false,
			message: "Credential ID is missing for Razorpay node",
		};
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value;

	if (!operation)
		throw new UnrecoverableError("razorpay node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "apiKey" || !credential.fields?.keyId || !credential.fields?.keySecret) {
			return {
				success: false,
				message: "Invalid credential format for Razorpay",
			};
		}

		const keyId = credential.fields.keyId as string;
		const keySecret = credential.fields.keySecret as string;

		if (operation === "create_order") {
			const amount = params.amount?.value;
			const currency = (params.currency?.value as string) || "INR";
			const receipt = params.receipt?.value as string | undefined;

			if (!amount) {
				return {
					success: false,
					message: "Amount is required to create an order",
				};
			}

			const body: Record<string, unknown> = {
				amount: Number(amount),
				currency,
			};
			if (receipt) body.receipt = receipt;

			const result = await callRazorpayApi("/orders", keyId, keySecret, {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "create_payment_link") {
			const amount = params.amount?.value;
			const currency = (params.currency?.value as string) || "INR";
			const description = params.description?.value as string | undefined;
			const customerName = params.customerName?.value as string | undefined;
			const customerEmail = params.customerEmail?.value as string | undefined;
			const customerContact = params.customerContact?.value as string | undefined;
			const notifyEmail = params.notifyEmail?.value;
			const notifySms = params.notifySms?.value;

			if (!amount) {
				return {
					success: false,
					message: "Amount is required to create a payment link",
				};
			}

			const body: Record<string, unknown> = {
				amount: Number(amount),
				currency,
			};
			if (description) body.description = description;
			if (customerName) {
				body.customer = {
					name: customerName,
				};
				if (customerEmail) (body.customer as Record<string, unknown>).email = customerEmail;
				if (customerContact) (body.customer as Record<string, unknown>).contact = customerContact;
			}
			body.notify = {
				email: notifyEmail === true || notifyEmail === "true",
				sms: notifySms === true || notifySms === "true",
			};

			const result = await callRazorpayApi("/payment_links", keyId, keySecret, {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "fetch_payment") {
			const paymentId = params.paymentId?.value;

			if (!paymentId) {
				return {
					success: false,
					message: "Payment ID is required to fetch a payment",
				};
			}

			const result = await callRazorpayApi(
				`/payments/${paymentId}`,
				keyId,
				keySecret,
			);

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		if (operation === "list_payments") {
			const count = params.count?.value;
			const skip = params.skip?.value;
			const fromDate = params.fromDate?.value as string | undefined;
			const toDate = params.toDate?.value as string | undefined;

			const queryParams = new URLSearchParams();
			if (count) queryParams.set("count", String(count));
			if (skip) queryParams.set("skip", String(skip));
			if (fromDate) {
				const fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
				queryParams.set("from", String(fromTimestamp));
			}
			if (toDate) {
				const toTimestamp = Math.floor(new Date(toDate).getTime() / 1000);
				queryParams.set("to", String(toTimestamp));
			}

			const query = queryParams.toString();
			const result = await callRazorpayApi(
				`/payments${query ? `?${query}` : ""}`,
				keyId,
				keySecret,
			);

			if (!result.success) {
				return { success: false, message: result.message };
			}

			return { success: true, output: result.data };
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		if (err instanceof UnrecoverableError) throw err;
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in Razorpay node",
		};
	}
};
