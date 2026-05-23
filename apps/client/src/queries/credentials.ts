import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCredentials, saveApiKey } from "../apis/credentials";

export const useGetCredentials = () => {
	return useQuery({
		queryKey: ["credentials"],
		queryFn: fetchCredentials,
		staleTime: Number.POSITIVE_INFINITY,
	});
};

export const useSaveApiKey = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			provider,
			apiKey,
			name,
		}: {
			provider: string;
			apiKey: string;
			name: string;
		}) => saveApiKey(provider, { apiKey, name }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["credentials"] });
		},
	});
};
