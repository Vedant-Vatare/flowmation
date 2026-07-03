export const CREDENTIALS_TYPE = ["apiKey", "oauth"] as const;

export const CREDENTIALS_PROVIDER = [
	"airtable",
	"ai",
	"calcom",
	"google",
	"github",
	"jira",
	"linear",
	"notion",
	"razorpay",
	"sentry",
	"slack",
	"telegram",
	"twilio",
] as const;

export type CredentialType = (typeof CREDENTIALS_TYPE)[number];

export type CredentialProvider = (typeof CREDENTIALS_PROVIDER)[number];
