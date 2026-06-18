import {
	DiscoverCircleIcon,
	Settings01Icon,
	TimelineListIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import BrandIcon from "@/assets/icons/flowmation_temp.svg";

type LeftSidebarProps = {
	activeWorkflow: string;
	setActiveWorkflow: (wf: string) => void;
	activeView: "workflows" | "logs";
	setActiveView: (view: "workflows" | "logs") => void;
};

const WORKFLOW_LIST = [
	{ key: "email", label: "Email Automation" },
	{ key: "meeting", label: "Meeting Scheduler" },
	{ key: "support", label: "Customer Support" },
] as const;

export function LeftSidebar({
	activeWorkflow,
	setActiveWorkflow,
	activeView,
	setActiveView,
}: LeftSidebarProps) {
	return (
		<div
			className="shrink-0 flex flex-col border-r border-border bg-sidebar"
			style={{ width: 256 }}
		>
			<div className="flex items-center gap-2 px-4 py-3 border-b border-border">
				<div className="flex items-center gap-2">
					<img src={BrandIcon} alt="flowmation logo" className="h-7 w-7" />
					<span className="text-md font-medium text-foreground">
						Flowmation
					</span>
				</div>
			</div>

			<div className="flex-1 overflow-hidden px-2 py-3">
				<div
					className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1.5"
					style={{ letterSpacing: "0.05em" }}
				>
					Workflows
				</div>
				<div className="space-y-0.5">
					{WORKFLOW_LIST.map((wf) => (
						<button
							key={wf.key}
							type="button"
							className="w-full text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors"
							style={{
								background:
									activeWorkflow === wf.key ? "var(--accent)" : "transparent",
								color: "var(--foreground)",
							}}
							onClick={() => {
								setActiveWorkflow(wf.key);
								setActiveView("workflows");
							}}
						>
							<div className="text-xs font-medium">{wf.label}</div>
						</button>
					))}
				</div>
			</div>

			<div className="border-t border-border px-2 py-2 space-y-0.5">
				<button
					type="button"
					className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm w-full text-left cursor-pointer transition-colors"
					style={{
						background: activeView === "logs" ? "var(--accent)" : "transparent",
						color:
							activeView === "logs"
								? "var(--foreground)"
								: "var(--muted-foreground)",
						fontWeight: activeView === "logs" ? 500 : 400,
					}}
					onClick={() => setActiveView("logs")}
				>
					<HugeiconsIcon
						icon={TimelineListIcon}
						strokeWidth={2}
						className="size-4"
					/>
					<span>Logs</span>
				</button>
				<div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground">
					<HugeiconsIcon
						icon={DiscoverCircleIcon}
						strokeWidth={2}
						className="size-4"
					/>
					<span>Templates</span>
				</div>
				<div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground">
					<HugeiconsIcon
						icon={Settings01Icon}
						strokeWidth={2}
						className="size-4"
					/>
					<span>Settings</span>
				</div>

				<div className="flex items-center gap-2.5 px-2 py-2 mt-1 border-t border-border pt-2">
					<div
						className="flex items-center justify-center rounded-lg text-xs font-semibold"
						style={{
							width: 28,
							height: 28,
							background: "oklch(0.9 0.05 285)",
							color: "oklch(0.5 0.2 285)",
						}}
					>
						JD
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-medium text-foreground truncate">
							Jane Doe
						</span>
						<span className="text-xs text-muted-foreground truncate">
							jane@example.com
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
