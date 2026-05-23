import type { NodeExecutorOutput } from "@/types/nodes.js";

export const handleResponse = async (
	response: Response,
	defaultMessage = "API request failed",
): Promise<NodeExecutorOutput> => {
	const data = (await response.json().catch(() => ({}))) as Record<
		string,
		unknown
	>;
	if (!response.ok) {
		return {
			success: false,
			message: (data.message as string) || defaultMessage,
			output: data,
		};
	}
	return { success: true, output: data };
};

export const handleGoogleAPIResponse = async (
	response: Response,
	errorMessage?: string,
): Promise<NodeExecutorOutput> => {
	const data = (await response.json().catch(() => ({}))) as Record<
		string,
		unknown
	>;
	if (!response.ok) {
		const errorData = data.error as
			| { message?: string; status?: number }
			| undefined;
		const message =
			errorData?.message || errorMessage || `API returned ${response.status}`;
		return {
			success: false,
			message,
			output: data,
		};
	}
	return { success: true, output: data };
};
