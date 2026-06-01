import api from "./axios";

export const logOutUserApi = async () => {
	return api.post("/auth/logout");
};
