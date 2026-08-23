import type { PublicTemplate } from "@/apis/templates";
import { NODE_UI_REGISTRY, type NodeUI } from "@/constants/nodes";

export type IntegrationDef = {
	key: string;
	label: string;
	task: string;
	keywords: string[];
};

export const INTEGRATION_DEFS: IntegrationDef[] = [
	{ key: "slack", label: "Slack", task: "action.slack", keywords: ["slack"] },
	{
		key: "gmail",
		label: "Gmail",
		task: "action.gmail",
		keywords: ["gmail", "email"],
	},
	{
		key: "google_sheets",
		label: "Google Sheets",
		task: "action.google_sheets",
		keywords: ["google sheets", "sheets"],
	},
	{
		key: "notion",
		label: "Notion",
		task: "action.notion",
		keywords: ["notion"],
	},
	{
		key: "hubspot",
		label: "HubSpot",
		task: "action.hubspot",
		keywords: ["hubspot"],
	},
	{
		key: "github",
		label: "GitHub",
		task: "action.github",
		keywords: ["github"],
	},
	{
		key: "discord",
		label: "Discord",
		task: "action.discord",
		keywords: ["discord"],
	},
	{
		key: "linear",
		label: "Linear",
		task: "action.linear",
		keywords: ["linear"],
	},
	{ key: "jira", label: "Jira", task: "action.jira", keywords: ["jira"] },
	{
		key: "airtable",
		label: "Airtable",
		task: "action.airtable",
		keywords: ["airtable"],
	},
	{
		key: "telegram",
		label: "Telegram",
		task: "action.telegram",
		keywords: ["telegram"],
	},
	{ key: "asana", label: "Asana", task: "action.asana", keywords: ["asana"] },
	{
		key: "trello",
		label: "Trello",
		task: "action.trello",
		keywords: ["trello"],
	},
	{
		key: "todoist",
		label: "Todoist",
		task: "action.todoist",
		keywords: ["todoist"],
	},
	{
		key: "clickup",
		label: "ClickUp",
		task: "action.clickup",
		keywords: ["clickup"],
	},
	{
		key: "google_calendar",
		label: "Google Calendar",
		task: "action.google_calendar",
		keywords: ["google calendar", "calendar"],
	},
	{
		key: "google_drive",
		label: "Google Drive",
		task: "action.google_drive",
		keywords: ["google drive", "drive"],
	},
	{
		key: "google_docs",
		label: "Google Docs",
		task: "action.google_docs",
		keywords: ["google docs", "docs"],
	},
	{
		key: "supabase",
		label: "Supabase",
		task: "action.supabase",
		keywords: ["supabase"],
	},
	{
		key: "firebase",
		label: "Firebase",
		task: "action.firebase",
		keywords: ["firebase"],
	},
	{
		key: "twilio",
		label: "Twilio",
		task: "action.twilio",
		keywords: ["twilio", "sms"],
	},
	{
		key: "sentry",
		label: "Sentry",
		task: "action.sentry",
		keywords: ["sentry"],
	},
	{
		key: "razorpay",
		label: "Razorpay",
		task: "action.razorpay",
		keywords: ["razorpay"],
	},
	{
		key: "ai",
		label: "AI",
		task: "action.ai",
		keywords: [" ai ", "ai ", " ai", "openai", "llm", "gpt"],
	},
	{
		key: "postgres",
		label: "Postgres",
		task: "action.postgres",
		keywords: ["postgres", "postgresql"],
	},
	{
		key: "mongodb",
		label: "MongoDB",
		task: "action.mongodb",
		keywords: ["mongodb", "mongo"],
	},
	{ key: "redis", label: "Redis", task: "action.redis", keywords: ["redis"] },
	{
		key: "calcom",
		label: "Cal.com",
		task: "action.calcom",
		keywords: ["cal.com", "cal com"],
	},
	{
		key: "mailchimp",
		label: "Mailchimp",
		task: "action.mailchimp",
		keywords: ["mailchimp"],
	},
];

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
	const haystack =
		`${template.title} ${template.description ?? ""} ${template.tags.join(" ")} ${template.category ?? ""}`.toLowerCase();
	const seen = new Map<string, InferredApp>();
	for (const def of INTEGRATION_DEFS) {
		for (const kw of def.keywords) {
			if (haystack.includes(kw.toLowerCase())) {
				if (!seen.has(def.key)) {
					const ui = getIntegrationUi(def.task);
					if (ui)
						seen.set(def.key, {
							key: def.key,
							label: def.label,
							task: def.task,
							ui,
						});
				}
				break;
			}
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
	"monthly",
	"quarterly",
	"hourly",
	"every hour",
	"monday",
	"thursday",
	"friday",
	"9 am",
	"8 am",
	"7:30",
	"reminder",
	"digest",
	"roll up",
	"report",
	"aggregate",
	"check",
	"scan",
	"cron",
];
const MANUAL_KWS = ["manual", "click", "run after", "run manually"];
// webhook is default for event-driven phrasing
const WEBHOOK_KWS = [
	"webhook",
	"when a",
	"when new",
	"whenever",
	"created",
	"submitted",
	"received",
	"opened",
	"booked",
	"published",
	"joined",
	"message",
	"inbound",
	"triggered",
	"new ",
	"form submitted",
];

export function inferTriggerForTemplate(
	template: PublicTemplate,
): TriggerKind | null {
	const hay = `${template.title} ${template.description ?? ""}`.toLowerCase();
	// schedule first — more specific
	for (const k of SCHEDULE_KWS) if (hay.includes(k)) return "schedule";
	for (const k of MANUAL_KWS) if (hay.includes(k)) return "manual";
	for (const k of WEBHOOK_KWS) if (hay.includes(k)) return "webhook";
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
	const inferred = inferTriggerForTemplate(template);
	if (inferred) return inferred === trigger;
	// fallback: if no inference, check haystack for trigger word
	const hay = `${template.title} ${template.description ?? ""}`.toLowerCase();
	if (trigger === "webhook" && hay.includes("webhook")) return true;
	if (
		trigger === "schedule" &&
		(hay.includes("schedule") || hay.includes("poll") || hay.includes("every"))
	)
		return true;
	if (trigger === "manual" && hay.includes("manual")) return true;
	return false;
}
