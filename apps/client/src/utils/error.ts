import axios from "axios";

export function formatNodeError(error: unknown): string {
	if (typeof error === "string") return error || "Unknown error";
	if (error == null) return "Unknown error";
	if (typeof error === "object") {
		if (
			"message" in error &&
			typeof error.message === "string" &&
			error.message
		) {
			return error.message;
		}
		if ("error" in error) {
			const detail = error.error;
			if (typeof detail === "string" && detail) return detail;
			if (
				detail &&
				typeof detail === "object" &&
				"message" in detail &&
				typeof detail.message === "string" &&
				detail.message
			) {
				return detail.message;
			}
		}
	}
	try {
		return JSON.stringify(error) ?? "Unknown error";
	} catch {
		return "Unknown error";
	}
}

export const getErrorMessage = (
	error: unknown,
	fallback = "Something went wrong",
) => {
	if (axios.isAxiosError<{ message: string }>(error)) {
		if (error.response && error.response.status >= 500) return fallback;
		const message = error.response?.data?.message;
		return typeof message === "string" && message.trim() ? message : fallback;
	}
	return fallback;
};
