export const hasExpressionsInParams = (value: unknown): boolean => {
	if (typeof value === "string") {
		return /\{\{[^}]+\}\}/.test(value);
	}

	if (Array.isArray(value)) {
		return value.some((item) => hasExpressionsInParams(item));
	}

	if (typeof value === "object" && value !== null) {
		return Object.values(value).some((v) => hasExpressionsInParams(v));
	}

	return false;
};
