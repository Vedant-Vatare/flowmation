import api from "./axios";

export type CredentialResponse = {
	id: string;
	name: string;
	provider: string;
	type: string;
	createdAt: string | Date;
};

export const fetchCredentials = async (): Promise<CredentialResponse[]> => {
	const response = await api.get<{ credentials: CredentialResponse[] }>("/credentials");
	return response.data.credentials;
};

export const saveApiKey = async (
	provider: string,
	data: { apiKey: string; name: string },
): Promise<void> => {
	await api.post(`/credentials/${provider}`, data);
};