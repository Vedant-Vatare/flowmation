export const hasExpressionsInParams = (text: string): boolean => {
	return /\{\{[^}]+\}\}/.test(text);
};
