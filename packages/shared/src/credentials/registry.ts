import { aiCredential } from "./providers/ai.js";
import { calcomCredential } from "./providers/calcom.js";
import { githubCredential } from "./providers/github.js";
import { googleCredential } from "./providers/google.js";
import { jiraOAuthCredential } from "./providers/jira-oauth.js";
import { linearOAuthCredential } from "./providers/linear-oauth.js";
import { notionCredential } from "./providers/notion.js";
import { razorpayCredential } from "./providers/razorpay.js";
import { slackCredential } from "./providers/slack.js";
import { telegramCredential } from "./providers/telegram.js";
import type { CredentialDef } from "./types.js";

export const credentialRegistry: Record<string, CredentialDef> = {
	ai: aiCredential,
	calcom: calcomCredential,
	google: googleCredential,
	github: githubCredential,
	jira: jiraOAuthCredential,
	linear: linearOAuthCredential,
	notion: notionCredential,
	razorpay: razorpayCredential,
	slack: slackCredential,
	telegram: telegramCredential,
};

export const API_KEY_PROVIDERS = Object.entries(credentialRegistry)
	.filter(([, def]) => def.type === "apiKey")
	.map(([name]) => name);

export * from "./types.js";
