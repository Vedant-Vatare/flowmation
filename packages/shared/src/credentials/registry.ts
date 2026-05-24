import { aiCredential } from "./providers/ai.js";
import { githubCredential } from "./providers/github.js";
import { googleCredential } from "./providers/google.js";
import { notionCredential } from "./providers/notion.js";
import { slackCredential } from "./providers/slack.js";
import { telegramCredential } from "./providers/telegram.js";
import type { CredentialDef } from "./types.js";

export const credentialRegistry: Record<string, CredentialDef> = {
	ai: aiCredential,
	google: googleCredential,
	github: githubCredential,
	notion: notionCredential,
	slack: slackCredential,
	telegram: telegramCredential,
};

export const API_KEY_PROVIDERS = Object.entries(credentialRegistry)
	.filter(([, def]) => def.type === "apiKey")
	.map(([name]) => name);

export * from "./types.js";
