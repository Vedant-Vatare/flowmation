import { motion } from "motion/react";

const TEMPLATES = [
	{
		name: "Lead Qualification",
		description: "Score incoming leads with AI and route to the right team",
		nodes: 5,
		tag: "AI",
		tagColor: "var(--primary)",
	},
	{
		name: "GitHub Issue Triage",
		description: "Auto-label, prioritize, and assign issues based on content",
		nodes: 4,
		tag: "GitHub",
		tagColor: "#8b5cf6",
	},
	{
		name: "Meeting Scheduler",
		description: "Check availability, book meetings, and send confirmations",
		nodes: 6,
		tag: "Calendar",
		tagColor: "#22c55e",
	},
	{
		name: "Slack Alert System",
		description: "Monitor conditions and send smart notifications to channels",
		nodes: 3,
		tag: "Slack",
		tagColor: "#e01e5a",
	},
];

export function TemplateVisual() {
	return (
		<div className="relative w-full rounded-xl border border-border overflow-hidden bg-sidebar">
			<header
				className="flex items-center gap-2 px-3 border-b border-border"
				style={{ height: 36 }}
			>
				<div className="flex items-center gap-1.5">
					<div className="size-2 rounded-full bg-muted-foreground/30" />
					<div className="size-2 rounded-full bg-muted-foreground/30" />
					<div className="size-2 rounded-full bg-muted-foreground/30" />
				</div>
				<div className="flex-1 flex justify-center">
					<div className="px-2 py-0.5 rounded text-[11px] font-medium bg-accent text-foreground">
						Templates
					</div>
				</div>
				<div className="w-12" />
			</header>

			<div className="p-4" style={{ height: 320 }}>
				{/* Search bar */}
				<div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card mb-3">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="var(--muted-foreground)"
						strokeWidth="2"
						strokeLinecap="round"
						role="img"
						aria-label="Search"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<span className="text-[12px] text-muted-foreground">
						Search templates...
					</span>
				</div>

				{/* Template grid - 2x2 */}
				<div className="grid grid-cols-2 gap-2">
					{TEMPLATES.map((template, i) => (
						<motion.div
							key={template.name}
							className="rounded-lg border border-border bg-card p-3 hover:border-muted-foreground/30 transition-colors cursor-pointer"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.4,
								delay: 0.2 + i * 0.08,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<div className="flex items-start justify-between mb-1.5">
								<div className="text-[12px] font-medium text-foreground leading-tight">
									{template.name}
								</div>
								<div
									className="px-1.5 py-0.5 rounded text-[8px] font-medium shrink-0 ml-2"
									style={{
										background: template.tagColor,
										color: "var(--background)",
										opacity: 0.9,
									}}
								>
									{template.tag}
								</div>
							</div>
							<div className="text-[10px] text-muted-foreground leading-snug mb-2">
								{template.description}
							</div>
							<div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
								<svg
									width="10"
									height="10"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									role="img"
									aria-label="Nodes"
								>
									<path d="M12 2L2 7l10 5 10-5-10-5z" />
									<path d="M2 17l10 5 10-5" />
									<path d="M2 12l10 5 10-5" />
								</svg>
								{template.nodes} nodes
							</div>
						</motion.div>
					))}
				</div>

				{/* Footer hint */}
				<div className="mt-3 flex items-center justify-between">
					<div className="text-[10px] text-muted-foreground/60">
						Community templates
					</div>
					<div className="text-[10px] text-primary font-medium cursor-pointer hover:underline">
						Create your own →
					</div>
				</div>
			</div>
		</div>
	);
}
