type ScheduleNodeInput = {
	task: string;
	parameters: { name: string; value?: unknown }[];
};

export type ScheduleRepeat = {
	every?: number;
	pattern?: string;
	limit?: number;
};

export const parseScheduleParams = (
	node: ScheduleNodeInput,
): ScheduleRepeat | null => {
	if (node.task !== "trigger.cron") return null;

	const getParam = (name: string) =>
		node.parameters.find((p) => p.name === name);

	const triggerType = getParam("trigger_type")?.value;
	if (triggerType !== "interval" && triggerType !== "cron") return null;

	const rawLimit = getParam("limit")?.value;
	const limit =
		rawLimit !== undefined && rawLimit !== null && rawLimit !== ""
			? Number(rawLimit)
			: undefined;
	const parsedLimit = Number.isFinite(limit) ? limit : undefined;

	if (triggerType === "interval") {
		const rawIntervalValue = getParam("interval_value")?.value;
		const intervalValue = Number(rawIntervalValue);
		if (!Number.isFinite(intervalValue) || intervalValue <= 0) return null;

		const unit = getParam("interval_unit")?.value;
		if (
			unit !== "seconds" &&
			unit !== "minutes" &&
			unit !== "hours" &&
			unit !== "days"
		)
			return null;

		const unitToMs: Record<string, number> = {
			seconds: 1000,
			minutes: 60 * 1000,
			hours: 60 * 60 * 1000,
			days: 24 * 60 * 60 * 1000,
		};

		return { every: intervalValue * (unitToMs[unit] ?? 0), limit: parsedLimit };
	}

	const cronExpression = getParam("cron_expression")?.value;
	if (typeof cronExpression !== "string" || !cronExpression.trim()) return null;

	return { pattern: cronExpression, limit: parsedLimit };
};
