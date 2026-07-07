import type { DateTimeNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

const UNIT_TO_MS: Record<string, number> = {
	seconds: 1000,
	minutes: 60 * 1000,
	hours: 60 * 60 * 1000,
	days: 24 * 60 * 60 * 1000,
	weeks: 7 * 24 * 60 * 60 * 1000,
};

function getMs(unit: string): number | null {
	return UNIT_TO_MS[unit] ?? null;
}

function parseDate(value: unknown): Date {
	if (value instanceof Date) return value;
	if (typeof value === "number") return new Date(value);
	if (typeof value === "string") {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: "${value}"`);
		return d;
	}
	throw new Error(`Cannot parse date from ${typeof value}`);
}

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

function formatDate(d: Date, fmt: string): string {
	const tokens: Record<string, string> = {
		yyyy: String(d.getUTCFullYear()),
		MM: pad(d.getUTCMonth() + 1),
		DD: pad(d.getUTCDate()),
		HH: pad(d.getUTCHours()),
		mm: pad(d.getUTCMinutes()),
		ss: pad(d.getUTCSeconds()),
	};
	let result = fmt;
	for (const [token, val] of Object.entries(tokens)) {
		result = result.replaceAll(token, val);
	}
	return result;
}

function now(outputFormat: string): string | number {
	return parse(new Date(), outputFormat);
}

function format(inputDate: unknown, fmt: string): string {
	return formatDate(parseDate(inputDate), fmt);
}

function parse(inputDate: unknown, outputFormat: string): string | number {
	const d = parseDate(inputDate);

	switch (outputFormat) {
		case "iso":
			return d.toISOString();
		case "unix_ms":
			return d.getTime();
		case "utc":
			return d.toUTCString();
		case "date_only":
			return d.toISOString().slice(0, 10);
		case "time_only":
			return d.toISOString().slice(11, 19);
		case "locale_date":
			return d.toLocaleDateString();
		case "locale_datetime":
			return d.toLocaleString();
		default:
			return d.toISOString();
	}
}

function addToDate(d: Date, amount: number, unit: string): Date {
	const result = new Date(d.getTime());

	switch (unit) {
		case "months": {
			const targetMonth = result.getUTCMonth() + amount;
			result.setUTCMonth(targetMonth);
			if (result.getUTCMonth() !== ((targetMonth % 12) + 12) % 12) {
				result.setUTCDate(0);
			}
			break;
		}
		case "years": {
			const targetYear = result.getUTCFullYear() + amount;
			const originalDay = result.getUTCDate();
			result.setUTCFullYear(targetYear);
			if (result.getUTCDate() !== originalDay) {
				result.setUTCDate(0);
			}
			break;
		}
		default: {
			const ms = getMs(unit);
			if (ms !== null) {
				result.setTime(result.getTime() + amount * ms);
			}
			break;
		}
	}

	return result;
}

function add(inputDate: unknown, amount: number, unit: string): string {
	return addToDate(parseDate(inputDate), amount, unit).toISOString();
}

function subtract(inputDate: unknown, amount: number, unit: string): string {
	return addToDate(parseDate(inputDate), -amount, unit).toISOString();
}

const PART_GETTERS: Record<string, (d: Date) => number> = {
	year: (d) => d.getUTCFullYear(),
	month: (d) => d.getUTCMonth() + 1,
	day: (d) => d.getUTCDate(),
	hour: (d) => d.getUTCHours(),
	minute: (d) => d.getUTCMinutes(),
	second: (d) => d.getUTCSeconds(),
	weekday: (d) => d.getUTCDay(),
	timestamp: (d) => d.getTime(),
};

function extract(inputDate: unknown, part: string): number {
	const getter = PART_GETTERS[part];
	if (!getter) throw new Error(`Unknown part: ${part}`);
	return getter(parseDate(inputDate));
}

function diff(inputDate: unknown, endDate: unknown, unit: string): number {
	const d1 = parseDate(inputDate);
	const d2 = parseDate(endDate);

	if (unit === "months") {
		const months = (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12
			+ (d2.getUTCMonth() - d1.getUTCMonth());
		return months;
	}

	if (unit === "years") {
		return d2.getUTCFullYear() - d1.getUTCFullYear();
	}

	const ms = getMs(unit);
	if (ms === null) throw new Error(`Unknown unit: ${unit}`);
	return Math.round((d2.getTime() - d1.getTime()) / ms);
}

export const dateTimeNodeExecutor = async (
	node: DateTimeNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);
		const operation = params.operation.value;

		let output: unknown;

		switch (operation) {
			case "now":
				output = now(String(params.output_format.value ?? "iso"));
				break;
			case "format":
				output = format(
					params.input_date.value,
					String(params.format.value ?? "yyyy-MM-dd"),
				);
				break;
			case "parse":
				output = parse(
					params.input_date.value,
					String(params.output_format.value ?? "iso"),
				);
				break;
			case "add":
				output = add(
					params.input_date.value,
					Number(params.amount.value) || 0,
					String(params.unit.value ?? "days"),
				);
				break;
			case "subtract":
				output = subtract(
					params.input_date.value,
					Number(params.amount.value) || 0,
					String(params.unit.value ?? "days"),
				);
				break;
			case "extract":
				output = extract(
					params.input_date.value,
					String(params.part.value ?? "day"),
				);
				break;
			case "diff":
				output = diff(
					params.input_date.value,
					params.end_date.value,
					String(params.unit.value ?? "days"),
				);
				break;
			default:
				return { success: false, message: `Unknown operation: ${operation}` };
		}

		return {
			success: true,
			output,
			status: "completed",
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Date/Time failed",
		};
	}
};
