import type { HubSpotNode } from "@nodebase/shared";
import { UnrecoverableError } from "bullmq";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { handleResponse } from "@/utils/api.utils.js";
import { getDecryptedCredential } from "@/utils/credentials.utils.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const HUBSPOT_API = "https://api.hubapi.com";
const HUBSPOT_VERSION = "2026-03";

const parseHubSpotError = async (res: Response): Promise<string> => {
	try {
		const body = (await res.json()) as Record<string, unknown>;
		const error = body.error as Record<string, unknown> | undefined;
		const errorBody = body.errorBody as Record<string, unknown> | undefined;
		const status = body.status as string | undefined;
		if (error?.message) return `HubSpot error: ${error.message}`;
		if (error?.category) return `HubSpot error: ${error.category}`;
		if (errorBody?.inputValidation) return `HubSpot error: ${JSON.stringify(errorBody.inputValidation)}`;
		if (status) return `HubSpot error: ${status}`;
		if (body.message) return `HubSpot error: ${body.message}`;
		return `HubSpot error: ${JSON.stringify(body)}`;
	} catch {
		return `HubSpot error: HTTP ${res.status}`;
	}
};

export const hubspotNodeExecutor = async (
	node: HubSpotNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	if (!node.credentialId) {
		return { success: false, message: "Credential ID is missing for HubSpot node" };
	}

	const params = await getResolvedParams(node, executionId);
	const operation = params.operation?.value as string;

	if (!operation)
		throw new UnrecoverableError("HubSpot node operation is invalid");

	try {
		const credential = await getDecryptedCredential(node.credentialId);
		if (credential.type !== "oauth2" || !credential.accessToken) {
			return { success: false, message: "Invalid credential format for HubSpot" };
		}

		const headers: Record<string, string> = {
			Authorization: `Bearer ${credential.accessToken}`,
			"Content-Type": "application/json",
			"HubSpot-Version": HUBSPOT_VERSION,
		};

		if (operation === "create_contact") {
			const firstName = params.firstName?.value as string;
			const lastName = params.lastName?.value as string;
			const email = params.email?.value as string;
			const phone = params.phone?.value as string | undefined;
			const company = params.company?.value as string | undefined;
			const jobTitle = params.jobTitle?.value as string | undefined;

			if (!firstName) throw new Error("firstName is required");
			if (!lastName) throw new Error("lastName is required");
			if (!email) throw new Error("email is required");

			const properties: Record<string, string> = {
				firstname: firstName,
				lastname: lastName,
				email,
			};
			if (phone) properties.phone = phone;
			if (company) properties.company = company;
			if (jobTitle) properties.jobtitle = jobTitle;

			const response = await fetch(`${HUBSPOT_API}/crm/objects/${HUBSPOT_VERSION}/contacts`, {
				method: "POST",
				headers,
				body: JSON.stringify({ properties }),
			});

			if (!response.ok) {
				return { success: false, message: await parseHubSpotError(response) };
			}

			return handleResponse(response);
		}

		if (operation === "update_contact") {
			const contactId = params.contactId?.value as string;
			const firstName = params.firstName?.value as string | undefined;
			const lastName = params.lastName?.value as string | undefined;
			const email = params.email?.value as string | undefined;
			const phone = params.phone?.value as string | undefined;
			const company = params.company?.value as string | undefined;
			const jobTitle = params.jobTitle?.value as string | undefined;

			if (!contactId) throw new Error("contactId is required");

			const properties: Record<string, string> = {};
			if (firstName) properties.firstname = firstName;
			if (lastName) properties.lastname = lastName;
			if (email) properties.email = email;
			if (phone) properties.phone = phone;
			if (company) properties.company = company;
			if (jobTitle) properties.jobtitle = jobTitle;

			const response = await fetch(
				`${HUBSPOT_API}/crm/objects/${HUBSPOT_VERSION}/contacts/${contactId}`,
				{
					method: "PATCH",
					headers,
					body: JSON.stringify({ properties }),
				},
			);

			if (!response.ok) {
				return { success: false, message: await parseHubSpotError(response) };
			}

			return handleResponse(response);
		}

		if (operation === "get_contact") {
			const contactId = params.contactId?.value as string;
			const email = params.email?.value as string;

			if (!contactId && !email) throw new Error("contactId or email is required");

			let url: string;
			if (email) {
				url = `${HUBSPOT_API}/crm/objects/${HUBSPOT_VERSION}/contacts/${encodeURIComponent(email)}?idProperty=email`;
			} else {
				url = `${HUBSPOT_API}/crm/objects/${HUBSPOT_VERSION}/contacts/${contactId}`;
			}

			const response = await fetch(url, { method: "GET", headers });

			if (!response.ok) {
				return { success: false, message: await parseHubSpotError(response) };
			}

			return handleResponse(response);
		}

		if (operation === "create_deal") {
			const dealName = params.dealName?.value as string;
			const dealStage = params.dealStage?.value as string | undefined;
			const amount = params.amount?.value as string | undefined;
			const pipeline = params.pipeline?.value as string | undefined;

			if (!dealName) throw new Error("dealName is required");

			const properties: Record<string, string> = {
				dealname: dealName,
			};
			if (dealStage) properties.dealstage = dealStage;
			if (amount) properties.amount = amount;
			if (pipeline) properties.pipeline = pipeline;

			const response = await fetch(`${HUBSPOT_API}/crm/objects/${HUBSPOT_VERSION}/deals`, {
				method: "POST",
				headers,
				body: JSON.stringify({ properties }),
			});

			if (!response.ok) {
				return { success: false, message: await parseHubSpotError(response) };
			}

			return handleResponse(response);
		}

		if (operation === "update_deal") {
			const dealId = params.dealId?.value as string;
			const dealName = params.dealName?.value as string | undefined;
			const dealStage = params.dealStage?.value as string | undefined;
			const amount = params.amount?.value as string | undefined;
			const pipeline = params.pipeline?.value as string | undefined;

			if (!dealId) throw new Error("dealId is required");

			const properties: Record<string, string> = {};
			if (dealName) properties.dealname = dealName;
			if (dealStage) properties.dealstage = dealStage;
			if (amount) properties.amount = amount;
			if (pipeline) properties.pipeline = pipeline;

			const response = await fetch(
				`${HUBSPOT_API}/crm/objects/${HUBSPOT_VERSION}/deals/${dealId}`,
				{
					method: "PATCH",
					headers,
					body: JSON.stringify({ properties }),
				},
			);

			if (!response.ok) {
				return { success: false, message: await parseHubSpotError(response) };
			}

			return handleResponse(response);
		}

		if (operation === "get_deal") {
			const dealId = params.dealId?.value as string;

			if (!dealId) throw new Error("dealId is required");

			const response = await fetch(
				`${HUBSPOT_API}/crm/objects/${HUBSPOT_VERSION}/deals/${dealId}`,
				{ method: "GET", headers },
			);

			if (!response.ok) {
				return { success: false, message: await parseHubSpotError(response) };
			}

			return handleResponse(response);
		}

		return { success: false, message: `Unsupported operation: ${operation}` };
	} catch (err) {
		if (err instanceof UnrecoverableError) throw err;
		return {
			success: false,
			message:
				err instanceof Error
					? err.message
					: "Something went wrong in HubSpot node",
		};
	}
};
