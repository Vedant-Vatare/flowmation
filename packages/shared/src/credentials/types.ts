export interface OAuth2CredentialDef {
	type: "oauth2";
	name: string;
	displayName: string;
	icon: string;
	authUrl: string;
	tokenUrl: string;
	scopes: string[];
	scopeSeparator?: string;
}

export interface ApiKeyCredentialDef {
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
}

export type CredentialDef = OAuth2CredentialDef | ApiKeyCredentialDef;
