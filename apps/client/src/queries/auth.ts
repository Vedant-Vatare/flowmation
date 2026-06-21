import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import {
	generatePasskeyRegistration,
	getCurrentUserApi,
	initiatePasskeyAuth,
	verifyPasskeyAuth,
	verifyPasskeyRegistration as verifyPasskeyRegistrationApi,
} from "../apis/auth";

export const currentUserOptions = () =>
	queryOptions({
		queryKey: ["current-user"],
		queryFn: getCurrentUserApi,
		staleTime: 5 * 60 * 1000,
	});

export const useCurrentUserQuery = () => useQuery(currentUserOptions());

export const usePasskeyAuth = () => {
	const initiate = useMutation({
		mutationFn: initiatePasskeyAuth,
	});

	const verify = useMutation({
		mutationFn: verifyPasskeyAuth,
	});

	return { initiate, verify };
};

export const usePasskeyRegistration = () => {
	const generate = useMutation({
		mutationFn: generatePasskeyRegistration,
	});

	const verify = useMutation({
		mutationFn: verifyPasskeyRegistrationApi,
	});

	return { generate, verify };
};
