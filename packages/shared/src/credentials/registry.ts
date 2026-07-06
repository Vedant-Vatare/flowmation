import { airtableCredential } from "./providers/airtable.js";
import { aiCredential } from "./providers/ai.js";
import { asanaCredential } from "./providers/asana.js";
import { calcomCredential } from "./providers/calcom.js";
import { githubCredential } from "./providers/github.js";
import { googleCredential } from "./providers/google.js";
import { hubspotCredential } from "./providers/hubspot.js";
import { jiraOAuthCredential } from "./providers/jira-oauth.js";
import { linearOAuthCredential } from "./providers/linear-oauth.js";
import { notionCredential } from "./providers/notion.js";
import { razorpayCredential } from "./providers/razorpay.js";
import { sentryCredential } from "./providers/sentry.js";
import { slackCredential } from "./providers/slack.js";
import { supabaseCredential } from "./providers/supabase.js";
import { telegramCredential } from "./providers/telegram.js";
import { firebaseCredential } from "./providers/firebase.js";
import { trelloCredential } from "./providers/trello.js";
import { twilioCredential } from "./providers/twilio.js";
import type { CredentialDef } from "./types.js";

export const credentialRegistry: Record<string, CredentialDef> = {
	airtable: airtableCredential,
	ai: aiCredential,
	asana: asanaCredential,
	calcom: calcomCredential,
	google: googleCredential,
	github: githubCredential,
	hubspot: hubspotCredential,
	jira: jiraOAuthCredential,
	linear: linearOAuthCredential,
	notion: notionCredential,
	razorpay: razorpayCredential,
	sentry: sentryCredential,
	slack: slackCredential,
	supabase: supabaseCredential,
	telegram: telegramCredential,
	firebase: firebaseCredential,
	trello: trelloCredential,
	twilio: twilioCredential,
};

export const API_KEY_PROVIDERS = Object.entries(credentialRegistry)
	.filter(([, def]) => def.type === "apiKey")
	.map(([name]) => name);

export * from "./types.js";
