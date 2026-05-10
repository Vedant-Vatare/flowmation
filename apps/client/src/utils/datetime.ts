export const formatRelativeTime = (date: Date | string) => {
	if (!date) return "-";
	const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
	const diff = (new Date(date).getTime() - Date.now()) / 1000;

	if (Math.abs(diff) < 60) return "just now";
	if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), "minute");
	if (Math.abs(diff) < 86400)
		return rtf.format(Math.round(diff / 3600), "hour");
	return rtf.format(Math.round(diff / 86400), "day");
};

export function formatTime(date: Date | undefined): string {
	if (!date) return "—";
	return new Date(date).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function getDurationDiff(
	startedAt: Date | undefined,
	completedAt: Date | undefined,
): string | null {
	if (!startedAt || !completedAt) return null;
	const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
	return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}
