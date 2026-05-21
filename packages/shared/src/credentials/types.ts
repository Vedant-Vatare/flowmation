export type OAuth2CredentialDef = {
	type: "oauth2";
	name: string;
	displayName: string;
	icon: string;
	authUrl: string;
	tokenUrl: string;
	scopes: string[];
	scopeSeparator?: string;
	authMethod?: "basic" | "body";
	pkce?: boolean;
	tokenContentType?: "json" | "form";
	getAccountIdentifier?: (accessToken: string) => Promise<string | null>;
};

export type ApiKeyCredentialDef = {
	type: "apiKey";
	name: string;
	displayName: string;
	icon: string;
	fields: {
		key: string;
		label: string;
		placeholder?: string;
		secret: boolean;
	}[];
};

export type CredentialDef = OAuth2CredentialDef | ApiKeyCredentialDef;
