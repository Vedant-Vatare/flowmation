import api from "@/apis/axios";

export const registerTestWebhookApi = async (webhookId: string) => {
	const response = await api.post<{ executionId: string }>(
		`/webhooks/test/register/${webhookId}`,
	);

	return response.data.executionId;
};
