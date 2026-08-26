/* biome-ignore-all lint/suspicious/noAssignInExpressions: standard regex loop */

export const EXPRESSION_REGEX = /\{\{[^}]+\}\}/;
export const EXPRESSION_SPLIT_REGEX = /(\{\{[^}]*\}\})/g;
export const EXPRESSION_TOKEN_CLASS = "rounded-sm bg-[#5e69d2]/40 px-px";

export type ExpressionToken = {
	text: string;
	isExpr: boolean;
};

export function tokenizeExpression(text: string): ExpressionToken[] {
	const parts: ExpressionToken[] = [];
	const regex = new RegExp(EXPRESSION_SPLIT_REGEX);
	let last = 0;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > last) {
			parts.push({ text: text.slice(last, match.index), isExpr: false });
		}
		parts.push({ text: match[0], isExpr: true });
		last = regex.lastIndex;
	}
	if (last < text.length) {
		parts.push({ text: text.slice(last), isExpr: false });
	}
	return parts;
}

export function hasExpression(value: string): boolean {
	return EXPRESSION_REGEX.test(value);
}

export function getActiveExpression(
	value: string,
	cursorPos: number,
): string | null {
	const textBeforeCursor = value.slice(0, cursorPos);
	const openIdx = textBeforeCursor.lastIndexOf("{{");
	if (openIdx === -1) return null;
	const between = textBeforeCursor.slice(openIdx + 2);
	if (between.includes("}}")) return null;
	return between;
}
