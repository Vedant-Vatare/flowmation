export const CREDENTIALS_TYPE = ["apiKey", "oauth", "database"] as const;

export const CREDENTIALS_PROVIDER = [
	"airtable",
	"ai",
	"asana",
	"calcom",
	"clickup",
	"firebase",
	"google",
	"github",
	"hubspot",
	"jira",
	"linear",
	"mongodb",
	"notion",
	"postgres",
	"razorpay",
	"sentry",
	"slack",
	"supabase",
	"telegram",
	"todoist",
	"trello",
	"twilio",
] as const;

export type CredentialType = (typeof CREDENTIALS_TYPE)[number];

export type CredentialProvider = (typeof CREDENTIALS_PROVIDER)[number];
