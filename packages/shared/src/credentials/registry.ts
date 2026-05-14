import { googleCredential } from "./providers/google.js";
import type { CredentialDef } from "./types.js";

export const credentialRegistry: Record<string, CredentialDef> = {
	google: googleCredential,
};

export * from "./types.js";
