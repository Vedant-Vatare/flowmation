import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

const getKey = (): Buffer => {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) throw new Error("ENCRYPTION_KEY is not set");

	const buf = Buffer.from(key, "hex");
	if (buf.byteLength !== 32) {
		throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
	}
	return buf;
};

export const encrypt = (text: string): string => {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	const authTag = cipher.getAuthTag().toString("hex");

	return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
	const parts = encryptedText.split(":");
	if (parts.length !== 3) {
		throw new Error("Invalid encrypted text format");
	}

	const ivPart = parts[0];
	const authTagPart = parts[1];
	const encryptedMessage = parts[2];

	if (!ivPart || !authTagPart || !encryptedMessage) {
		throw new Error("Invalid encrypted text format");
	}

	const iv = Buffer.from(ivPart, "hex");
	const authTag = Buffer.from(authTagPart, "hex");

	const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
	decrypted += decipher.final("utf8");

	return decrypted;
};
