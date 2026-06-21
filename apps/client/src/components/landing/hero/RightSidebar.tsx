import { NODE_UI_REGISTRY } from "@/constants/nodes";

type NodeGroup = { task: string; name: string };

const TRIGGER_NODES: NodeGroup[] = [
	{ task: "trigger.webhook", name: "Webhook" },
	{ task: "trigger.cron", name: "Schedule" },
	{ task: "trigger.input", name: "Input Trigger" },
];

const ACTION_NODES: NodeGroup[] = [
	{ task: "action.http", name: "HTTP Request" },
	{ task: "action.ai", name: "AI" },
	{ task: "action.condition", name: "Condition" },
	{ task: "action.wait", name: "Wait" },
	{ task: "action.set_variable", name: "Set Variable" },
	{ task: "action.random_number", name: "Random Number" },
	{ task: "action.merge", name: "Merge Data" },
	{ task: "action.click", name: "Click" },
];

const INTEGRATION_NODES: NodeGroup[] = [
	{ task: "action.gmail", name: "Gmail" },
	{ task: "action.google_calendar", name: "Google Calendar" },
	{ task: "action.google_drive", name: "Google Drive" },
	{ task: "action.google_sheets", name: "Google Sheets" },
	{ task: "action.slack", name: "Slack" },
	{ task: "action.discord", name: "Discord" },
	{ task: "action.github", name: "GitHub" },
	{ task: "action.notion", name: "Notion" },
	{ task: "action.telegram", name: "Telegram" },
	{ task: "action.razorpay", name: "Razorpay" },
	{ task: "action.calcom", name: "Cal.com" },
];

function NodeGroupSection({
	title,
	nodes,
}: {
	title: string;
	nodes: NodeGroup[];
}) {
	return (
		<div>
			<div
				className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1"
				style={{ letterSpacing: "0.05em" }}
			>
				{title}
			</div>
			<div className="space-y-0.5">
				{nodes.map((node) => {
					const ui = NODE_UI_REGISTRY[node.task];
					if (!ui) return null;
					const Icon = ui.icon;
					return (
						<div
							key={node.task}
							className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-background transition-colors text-sm tracking-tight"
						>
							<div
								className="size-6 p-0.5 rounded-sm shrink-0 flex items-center justify-center"
								style={{ background: ui.iconBackground ?? ui.background }}
							>
								{ui.branded ? (
									<Icon className="size-5 rounded-sm shrink-0" />
								) : (
									<Icon
										className="size-5 p-0.5 rounded-sm shrink-0"
										style={{ color: ui.color }}
									/>
								)}
							</div>
							<span>{node.name}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function RightSidebar() {
	return (
		<div
			className="shrink-0 border-l border-border bg-sidebar flex flex-col"
			style={{ width: 240 }}
		>
			<div className="flex gap-1 px-2 pt-3 pb-1.5 border-b border-border">
				{(["Nodes", "Editor", "Runs"] as const).map((tab, i) => (
					<button
						key={tab}
						type="button"
						className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
						style={{
							background: i === 0 ? "var(--accent)" : "transparent",
							color: i === 0 ? "var(--foreground)" : "var(--muted-foreground)",
						}}
					>
						{tab}
					</button>
				))}
			</div>
			<div className="flex-1 overflow-auto px-2 py-2">
				<div className="space-y-3">
					<NodeGroupSection title="Triggers" nodes={TRIGGER_NODES} />
					<NodeGroupSection title="Actions" nodes={ACTION_NODES} />
					<NodeGroupSection title="Integrations" nodes={INTEGRATION_NODES} />
				</div>
			</div>
		</div>
	);
}
