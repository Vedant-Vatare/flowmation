import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

export const encrypt = (text: string): string => {
	const key = process.env.ENCRYPTION_KEY;
	if (!key || key.length !== 32) {
		throw new Error(
			"ENCRYPTION_KEY environment variable must be 32 characters long",
		);
	}

	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);

	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	const authTag = cipher.getAuthTag().toString("hex");

	return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
	const key = process.env.ENCRYPTION_KEY;
	if (!key || key.length !== 32) {
		throw new Error(
			"ENCRYPTION_KEY environment variable must be 32 characters long",
		);
	}

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

	const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
	decrypted += decipher.final("utf8");

	return decrypted;
};
