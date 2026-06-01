import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { logOutUserApi } from "./auth";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (!(error instanceof AxiosError)) return Promise.reject(error);

		if (error.response?.status === 401) {
			const message = error.response?.data?.message;
			if (message) {
				toast.info(`${message}\nLogin again to continue.`);
			}
			await logOutUserApi();
			return Promise.reject(error);
		}

		return Promise.reject(error);
	},
);

export default api;
