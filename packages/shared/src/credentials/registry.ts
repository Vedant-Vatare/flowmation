import { githubCredential } from "./providers/github.js";
import { googleCredential } from "./providers/google.js";
import type { CredentialDef } from "./types.js";

export const credentialRegistry: Record<string, CredentialDef> = {
	google: googleCredential,
	github: githubCredential,
};

export * from "./types.js";
