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

export function getTemplateIntegrations(
	template: PublicTemplate,
): InferredApp[] {
	const seen = new Map<string, InferredApp>();
	for (const task of template.integrationsUsed ?? []) {
		const ui = NODE_UI_REGISTRY[task];
		if (!ui || seen.has(task)) continue;
		seen.set(task, { key: task, label: ui.name, task, ui });
	}
	return Array.from(seen.values());
}

export type TriggerKind = "webhook" | "schedule" | "manual";

const TRIGGER_LABELS: Record<TriggerKind, string> = {
	webhook: "Webhook",
	schedule: "Schedule",
	manual: "Manual",
};

export function getTriggerKind(template: PublicTemplate): TriggerKind | null {
	const t = template.triggerType;
	if (t === "webhook" || t === "schedule" || t === "manual") return t;
	return null;
}

export function getTriggerLabel(kind: TriggerKind): string {
	return TRIGGER_LABELS[kind];
}

export function matchesTriggerFilter(
	template: PublicTemplate,
	trigger: TriggerKind | null,
): boolean {
	if (!trigger) return true;
	return getTriggerKind(template) === trigger;
}
