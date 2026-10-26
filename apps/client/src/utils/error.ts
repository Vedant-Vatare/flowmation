import axios from "axios";

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
