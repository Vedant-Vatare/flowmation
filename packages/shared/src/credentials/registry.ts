import { githubCredential } from "./providers/github.js";
import { googleCredential } from "./providers/google.js";
import { notionCredential } from "./providers/notion.js";
import type { CredentialDef } from "./types.js";

export const credentialRegistry: Record<string, CredentialDef> = {
	google: googleCredential,
	github: githubCredential,
	notion: notionCredential,
};

export * from "./types.js";
