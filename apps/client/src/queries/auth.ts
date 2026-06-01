import { useMutation } from "@tanstack/react-query";
import {
	generatePasskeyRegistration,
	initiatePasskeyAuth,
	verifyPasskeyAuth,
	verifyPasskeyRegistration as verifyPasskeyRegistrationApi,
} from "../apis/auth";

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
