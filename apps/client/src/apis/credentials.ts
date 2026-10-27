import api from "./axios";

export type CredentialResponse = {
	id: string;
	name: string;
	provider: string;
	type: string;
	createdAt: string | Date;
	updatedAt?: string | Date;
	workflowCount?: number;
};

export type CredentialWorkflow = {
	id: string;
	name: string | null;
	status: string | null;
};

export const fetchCredentialUsage = async (
	id: string,
): Promise<CredentialWorkflow[]> => {
	const response = await api.get<{ workflows: CredentialWorkflow[] }>(
		`/credentials/${id}/usage`,
	);
	return response.data.workflows;
};

export const updateCredential = async (
	id: string,
	data: { name?: string; fields?: Record<string, string> },
) => {
	await api.patch(`/credentials/${id}`, data);
};

export const deleteCredential = async (id: string) => {
	await api.delete(`/credentials/${id}`);
};

export const fetchCredentials = async (): Promise<CredentialResponse[]> => {
	const response = await api.get<{ credentials: CredentialResponse[] }>(
		"/credentials",
	);
	return response.data.credentials;
};

export const saveApiKey = async (
	provider: string,
	data: Record<string, string>,
): Promise<void> => {
	await api.post(`/credentials/${provider}`, data);
};
