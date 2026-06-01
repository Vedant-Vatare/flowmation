import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { router } from "@/main";
import { clearAuthCookie } from "@/utils/auth";
import { logOutUserApi } from "./auth";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

let isLoggingOut = false;

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (!(error instanceof AxiosError)) return Promise.reject(error);

		if (error.response?.status === 401 && !isLoggingOut) {
			isLoggingOut = true;

			const message = error.response?.data?.message;
			if (message) {
				toast.info(`${message}\nLogin again to continue.`);
			}

			try {
				await logOutUserApi();
			} catch (e: unknown) {
				console.log("failed to log out", e);
				toast.error("fail to logout user");
			}

			await clearAuthCookie();
			router.navigate({ to: "/auth/login" });

			setTimeout(() => {
				isLoggingOut = false;
			}, 1000);
		}

		return Promise.reject(error);
	},
);

export default api;
