import { useQuery } from "@tanstack/react-query";
import { fetchCredentials } from "../apis/credentials";

export const useGetCredentials = () => {
	return useQuery({
		queryKey: ["credentials"],
		queryFn: fetchCredentials,
		staleTime: Number.POSITIVE_INFINITY,
	});
};
