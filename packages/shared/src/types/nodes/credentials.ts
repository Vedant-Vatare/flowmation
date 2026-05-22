export const CREDENTIALS_TYPE = ["apiKey", "oauth"] as const;

export const CREDENTIALS_PROVIDER = [
	"google",
	"github",
	"notion",
	"slack",
] as const;

export type CredentialType = (typeof CREDENTIALS_TYPE)[number];

export type CredentialProvider = (typeof CREDENTIALS_PROVIDER)[number];
