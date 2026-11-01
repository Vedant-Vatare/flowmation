import api from "./axios";

export type Account = {
	name: string;
	email: string;
	googleConnected: boolean;
	passkeys: {
		id: string;
		name: string;
		createdAt: string | null;
		lastUsedAt: string | null;
	}[];
};
export const getAccount = async () => (await api.get<Account>("/account")).data;
export const updateAccount = async (name: string) =>
	(await api.patch("/account", { name })).data;
export const removePasskey = async (id: string) =>
	(await api.delete(`/account/passkeys/${id}`)).data;

export const connectAccountGoogle = async (email?: string) =>
	(await api.post<{ url: string }>("/account/google", { email })).data;
