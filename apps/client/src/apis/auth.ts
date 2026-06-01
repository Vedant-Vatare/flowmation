import type {
	AuthenticationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import api from "./axios";

export const logOutUserApi = async () => {
	return api.post("/auth/logout");
};

type PasskeyInitiateResponse = (
	| { mode: "signup"; options: PublicKeyCredentialCreationOptionsJSON }
	| { mode: "login"; options: PublicKeyCredentialRequestOptionsJSON }
) &
	Record<string, unknown>;

export const initiatePasskeyAuth = async (email: string) => {
	const res = await api.post<PasskeyInitiateResponse>(
		"/auth/passkey/initiate",
		{ email },
	);
	const { mode, options } = res.data;
	return { mode, options } as
		| { mode: "signup"; options: PublicKeyCredentialCreationOptionsJSON }
		| { mode: "login"; options: PublicKeyCredentialRequestOptionsJSON };
};

export const verifyPasskeyAuth = async (
	attResp: RegistrationResponseJSON | AuthenticationResponseJSON,
) => {
	const res = await api.post<{ verified: boolean }>(
		"/auth/passkey/verify",
		attResp,
	);
	return res.data.verified;
};

export const generatePasskeyRegistration = async () => {
	const res = await api.post<PublicKeyCredentialCreationOptionsJSON>(
		"/auth/passkey/generate-registration",
	);
	return res.data;
};

export const verifyPasskeyRegistration = async (
	attResp: RegistrationResponseJSON,
) => {
	const res = await api.post<{ verified: boolean }>(
		"/auth/passkey/verify-registration",
		attResp,
	);
	return res.data.verified;
};
