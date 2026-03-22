import type { NodeParameters } from "@nodebase/shared";

type KeyValueEntry = Record<string, string>;

export const getTypedParams = <T extends { name: string }>(parameters: T[]) => {
	return Object.fromEntries(parameters.map((p) => [p.name, p])) as {
		[K in T["name"]]: Extract<T, { name: K }>;
	};
};

const isValidKeyValueEntry = (entry: KeyValueEntry): boolean => {
	return Object.entries(entry).every(
		([key, value]) => key !== "" && value !== "",
	);
};

export const checkKeyValueParam = (
	value: KeyValueEntry | KeyValueEntry[],
): boolean => {
	if (Array.isArray(value)) {
		return (
			value.length > 0 &&
			value.some((e) => Object.keys(e)[0] !== "") &&
			value.every(isValidKeyValueEntry)
		);
	}

	return isValidKeyValueEntry(value);
};

export const flattenKeyValueParam = (
	arr: Record<string, string>[],
): Record<string, string> =>
	arr.reduce(
		(acc, record) => {
			if ("key" in record && "value" in record) {
				if (record.key) acc[record.key] = record.value;
				return acc;
			}

			for (const [key, value] of Object.entries(record)) {
				if (key) acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string>,
	);

export const checkRequiredParameters = (
	params: NodeParameters[],
): { valid: boolean; missing: string[] } => {
	const missing: string[] = [];

	for (const p of params) {
		if (!p.required) continue;

		if (p.value === undefined || p.value === null || p.value === "") {
			missing.push(p.label);
			continue;
		}

		if (p.type === "key-value") {
			if (!checkKeyValueParam(p.value as KeyValueEntry | KeyValueEntry[])) {
				missing.push(p.label);
			}
			continue;
		}

		if (Array.isArray(p.value) && p.value.length === 0) {
			missing.push(p.label);
		}
	}

	return { valid: missing.length === 0, missing };
};
