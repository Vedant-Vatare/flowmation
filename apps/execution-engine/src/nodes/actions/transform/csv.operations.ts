import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const MAX_BYTES = 1024 * 1024;
const MAX_ITEMS = 10000;
const unsafeKeys = new Set(["__proto__", "constructor", "prototype"]);

export function boundedText(value: unknown, label: string): string {
	if (typeof value !== "string") throw new Error(`${label} must be text`);
	if (Buffer.byteLength(value, "utf8") > MAX_BYTES)
		throw new Error(`${label} exceeds 1 MB`);
	return value;
}

function jsonInput(value: unknown): unknown {
	if (typeof value === "string")
		return JSON.parse(boundedText(value, "Input data"));
	const json = JSON.stringify(value);
	if (json === undefined) throw new Error("Input data must be JSON");
	boundedText(json, "Input data");
	return value;
}

function booleanOption(value: unknown, fallback: boolean): boolean {
	if (value === undefined || value === "") return fallback;
	if (typeof value !== "boolean") throw new Error("Expected a boolean option");
	return value;
}

export function runCsv(
	operation: unknown,
	input: unknown,
	delimiter: unknown,
	headerValue: unknown,
	escapeValue: unknown,
) {
	if (![",", ";", "\t", "|"].includes(delimiter as string))
		throw new Error("Choose a supported CSV delimiter");
	const header = booleanOption(headerValue, true);
	if (operation === "parse") {
		const text = boundedText(input, "CSV input");
		let outputBytes = 2; // JSON array brackets, including repeated header keys.
		const rows = parse(text, {
			on_record: <T>(record: T) => {
				outputBytes += Buffer.byteLength(JSON.stringify(record), "utf8") + 1;
				if (outputBytes > MAX_BYTES)
					throw new Error("CSV parsed output exceeds 1 MB");
				return record;
			},
			delimiter: delimiter as string,
			bom: true,
			skip_empty_lines: true,
			max_record_size: MAX_BYTES,
			columns: header
				? (columns: string[]) => {
						if (new Set(columns).size !== columns.length)
							throw new Error("CSV contains duplicate column names");
						if (columns.some((key) => unsafeKeys.has(key)))
							throw new Error("CSV contains a reserved column name");
						return columns;
					}
				: false,
			to: MAX_ITEMS + 1,
		}) as unknown[];
		if (rows.length > MAX_ITEMS) throw new Error("CSV exceeds 10,000 rows");
		return { rows, count: rows.length };
	}
	if (operation === "generate") {
		const records = jsonInput(input);
		if (!Array.isArray(records))
			throw new Error("CSV generation expects a JSON array of objects");
		if (records.length > MAX_ITEMS) throw new Error("CSV exceeds 10,000 rows");
		const columns = new Set<string>();
		for (const row of records) {
			if (!row || typeof row !== "object" || Array.isArray(row))
				throw new Error("Each CSV row must be an object");
			for (const [key, value] of Object.entries(row)) {
				if (unsafeKeys.has(key))
					throw new Error("CSV contains a reserved column name");
				if (
					value !== null &&
					!["string", "number", "boolean"].includes(typeof value)
				)
					throw new Error("CSV cells must be text, numbers, booleans, or null");
				if (typeof value === "number" && !Number.isFinite(value))
					throw new Error("CSV numbers must be finite");
				columns.add(key);
			}
		}
		if (records.length && columns.size === 0)
			throw new Error("CSV rows must contain at least one column");
		// Sparse records can expand into a very wide rectangular CSV.
		if (records.length * columns.size > MAX_BYTES)
			throw new Error("CSV output exceeds 1 MB");
		const csv = records.length
			? stringify(records, {
					delimiter: delimiter as string,
					header,
					columns: [...columns],
					escape_formulas: booleanOption(escapeValue, true),
					record_delimiter: "\n",
				})
			: "";
		boundedText(csv, "CSV output");
		return { csv, count: records.length };
	}
	throw new Error("Unsupported CSV operation");
}
