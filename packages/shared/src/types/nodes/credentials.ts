export const CREDENTIALS_TYPE = ["apiKey", "oauth", "database"] as const;

export const CREDENTIALS_PROVIDER = [
	"airtable",
	"ai",
	"asana",
	"calcom",
	"clickup",
	"discord",
	"firebase",
	"google",
	"github",
	"github_webhook",
	"hubspot",
	"jira",
	"linear",
	"mailchimp",
	"mongodb",
	"notion",
	"postgres",
	"razorpay",
	"redis",
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
