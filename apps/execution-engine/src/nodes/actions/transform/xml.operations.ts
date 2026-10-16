import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";

const MAX_BYTES = 1024 * 1024;
const MAX_DEPTH = 64;
const MAX_ITEMS = 10000;
const reservedNames = new Set([
	"__proto__",
	"constructor",
	"prototype",
	"hasOwnProperty",
	"toString",
	"valueOf",
	"__defineGetter__",
	"__defineSetter__",
	"__lookupGetter__",
	"__lookupSetter__",
]);
const invalidCharacters =
	/[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u;

function textInput(value: unknown, label: string): string {
	if (typeof value !== "string") throw new Error(`${label} must be text`);
	if (Buffer.byteLength(value, "utf8") > MAX_BYTES)
		throw new Error(`${label} exceeds 1 MB`);
	if (invalidCharacters.test(value))
		throw new Error(`${label} contains invalid XML characters`);
	return value;
}

function checkName(name: string): void {
	if (
		!name ||
		/[<>&"'/=\s?]/u.test(name) ||
		XMLValidator.validate(`<${name}/>`) !== true
	)
		throw new Error(`Invalid XML element or attribute name: ${name}`);
	if (reservedNames.has(name))
		throw new Error(`XML contains a reserved name: ${name}`);
}

function generationInput(input: unknown): object {
	const data: unknown =
		typeof input === "string"
			? JSON.parse(textInput(input, "Input data"))
			: input;
	if (data === null || typeof data !== "object")
		throw new Error("XML generation expects a JSON object or array");
	let items = 0;
	function validate(value: unknown, depth: number): void {
		if (depth > MAX_DEPTH)
			throw new Error("XML generation supports up to 64 nested levels");
		if (++items > MAX_ITEMS)
			throw new Error("XML generation exceeds 10,000 values");
		if (typeof value === "string") {
			textInput(value, "XML value");
			return;
		}
		if (typeof value === "number") {
			if (!Number.isFinite(value))
				throw new Error("XML numbers must be finite");
			return;
		}
		if (value === null || typeof value === "boolean") return;
		if (typeof value !== "object")
			throw new Error("XML values must be JSON values");
		if (Array.isArray(value)) {
			for (const entry of value) validate(entry, depth + 1);
			return;
		}
		if (
			Object.getPrototypeOf(value) !== Object.prototype &&
			Object.getPrototypeOf(value) !== null
		)
			throw new Error("XML generation expects plain JSON objects");
		for (const [key, entry] of Object.entries(value)) {
			if (key !== "#text") checkName(key.startsWith("@_") ? key.slice(2) : key);
			if (
				(key.startsWith("@_") || key === "#text") &&
				(entry === null || typeof entry === "object")
			)
				throw new Error(
					"XML attributes and #text must be text, numbers, or booleans",
				);
			validate(entry, depth + 1);
		}
	}
	validate(data, 0);
	textInput(JSON.stringify(data), "Input data");
	return data;
}

function checkDocumentRoot(xml: string): void {
	let depth = 0;
	let roots = 0;
	let cursor = 0;
	const tokens =
		/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?(?:[^>"']|"[^"]*"|'[^']*')*>/g;
	for (const token of xml.matchAll(tokens)) {
		const start = token.index;
		const value = token[0];
		if (depth === 0 && xml.slice(cursor, start).trim())
			throw new Error("XML must contain exactly one root element");
		if (value.startsWith("<![CDATA[")) {
			if (depth === 0) throw new Error("CDATA must be inside the root element");
		} else if (!value.startsWith("<!--") && !value.startsWith("<?")) {
			if (value.startsWith("</")) depth--;
			else {
				if (depth === 0 && ++roots > 1)
					throw new Error("XML must contain exactly one root element");
				if (!/\/\s*>$/.test(value)) depth++;
			}
		}
		if (depth > MAX_DEPTH)
			throw new Error("XML supports up to 64 nested levels");
		cursor = start + value.length;
	}
	if (roots !== 1 || depth !== 0 || xml.slice(cursor).trim())
		throw new Error("XML must contain exactly one root element");
}

export function runXml(operation: unknown, input: unknown, rootName: unknown) {
	if (operation === "parse") {
		const xml = textInput(input, "XML input");
		const markup = xml.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, "");
		if (/<!DOCTYPE|<!ENTITY/i.test(markup))
			throw new Error(
				"XML declarations for DTDs and custom entities are not supported",
			);
		if (/&(?!(?:amp|lt|gt|apos|quot|#\d+|#x[\da-fA-F]+);)/.test(markup))
			throw new Error("XML contains an unknown or malformed entity");
		for (const match of markup.matchAll(/&#(x[\da-fA-F]+|\d+);/g)) {
			const token = match[1] ?? "";
			const point = Number.parseInt(
				token.startsWith("x") ? token.slice(1) : token,
				token.startsWith("x") ? 16 : 10,
			);
			if (
				point > 0x10ffff ||
				invalidCharacters.test(String.fromCodePoint(point))
			)
				throw new Error("XML contains an invalid character reference");
		}
		checkDocumentRoot(xml);
		const valid = XMLValidator.validate(xml);
		if (valid !== true) throw new Error(`Invalid XML: ${valid.err.msg}`);
		let elements = 0;
		const data = new XMLParser({
			ignoreAttributes: false,
			htmlEntities: true,
			attributeNamePrefix: "@_",
			parseTagValue: false,
			parseAttributeValue: false,
			trimValues: true,
			ignoreDeclaration: true,
			ignorePiTags: true,
			maxNestedTags: MAX_DEPTH,
			onDangerousProperty: (name) => {
				throw new Error(`XML contains a reserved name: ${name}`);
			},
			updateTag: (name) => {
				if (++elements > MAX_ITEMS)
					throw new Error("XML exceeds 10,000 elements");
				return name;
			},
		}).parse(xml);
		const roots = Object.keys(data).filter((key) => key !== "#text");
		if (
			roots.length !== 1 ||
			Array.isArray(data[roots[0] ?? ""]) ||
			(data["#text"] && String(data["#text"]).trim())
		)
			throw new Error("XML must contain exactly one root element");
		textInput(JSON.stringify(data), "XML output");
		return { data };
	}
	if (operation === "generate") {
		if (typeof rootName !== "string" || rootName.length > 200)
			throw new Error(
				"Root element must be a valid XML name (up to 200 characters)",
			);
		checkName(rootName);
		const data = generationInput(input);
		const xml = new XMLBuilder({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			format: true,
			suppressBooleanAttributes: false,
			maxNestedTags: MAX_DEPTH,
		}).build({ [rootName]: Array.isArray(data) ? { item: data } : data });
		textInput(xml, "XML output");
		const valid = XMLValidator.validate(xml);
		if (valid !== true)
			throw new Error(`Cannot generate valid XML: ${valid.err.msg}`);
		return { xml };
	}
	throw new Error("Unsupported XML operation");
}
