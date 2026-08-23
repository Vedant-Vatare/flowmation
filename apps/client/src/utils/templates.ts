import type { PublicTemplate } from "@/apis/templates";
import { NODE_UI_REGISTRY, type NodeUI } from "@/constants/nodes";

export function getIntegrationUi(task: string): NodeUI | null {
	return NODE_UI_REGISTRY[task] ?? null;
}

export type InferredApp = {
	key: string;
	label: string;
	task: string;
	ui: NodeUI;
};

export function inferAppsForTemplate(template: PublicTemplate): InferredApp[] {
	const searchableText =
		`${template.title} ${template.description ?? ""} ${template.tags.join(" ")} ${template.category ?? ""}`.toLowerCase();
	const seen = new Map<string, InferredApp>();

	for (const [task, ui] of Object.entries(NODE_UI_REGISTRY)) {
		if (!ui.branded) continue;
		const name = ui.name.toLowerCase();
		if (name.length < 2) continue;
		if (searchableText.includes(name)) {
			if (!seen.has(ui.name))
				seen.set(ui.name, { key: task, label: ui.name, task, ui });
		}
	}

	return Array.from(seen.values());
}

export type TriggerKind = "webhook" | "schedule" | "manual";

const SCHEDULE_KWS = [
	"schedule",
	"poll",
	"every ",
	"daily",
	"weekly",
	"cron",
	"reminder",
	"digest",
	"monday",
	"hourly",
];
const MANUAL_KWS = ["manual", "click"];
const WEBHOOK_KWS = [
	"webhook",
	"when a",
	"when new",
	"created",
	"submitted",
	"received",
	"published",
	"booked",
	"opened",
	"new ",
];

export function inferTriggerForTemplate(
	template: PublicTemplate,
): TriggerKind | null {
	const searchableText =
		`${template.title} ${template.description ?? ""}`.toLowerCase();
	for (const k of SCHEDULE_KWS)
		if (searchableText.includes(k)) return "schedule";
	for (const k of MANUAL_KWS) if (searchableText.includes(k)) return "manual";
	for (const k of WEBHOOK_KWS) if (searchableText.includes(k)) return "webhook";
	return null;
}

export function getTriggerLabel(kind: TriggerKind): string {
	if (kind === "webhook") return "Webhook";
	if (kind === "schedule") return "Schedule";
	return "Manual";
}

export function matchesTriggerFilter(
	template: PublicTemplate,
	trigger: TriggerKind | null,
): boolean {
	if (!trigger) return true;
	return inferTriggerForTemplate(template) === trigger;
}
