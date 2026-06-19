import { PanelLeftIcon, Rocket01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Edge } from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useState } from "react";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { LeftSidebar } from "./hero/LeftSidebar";
import { LogsView } from "./hero/LogsView";
import { RightSidebar } from "./hero/RightSidebar";
import { WorkflowCanvas } from "./hero/WorkflowCanvas";
import { EDGE_STYLE, WORKFLOWS } from "./hero/workflow-data";

const WORKFLOW_LABELS: Record<string, string> = {
	email: "Email Automation",
	meeting: "Meeting Scheduler",
	support: "Customer Support",
};

export function HeroPanel() {
	const [activeWorkflow, setActiveWorkflow] = useState("email");
	const [activeView, setActiveView] = useState<"workflows" | "logs">(
		"workflows",
	);

	const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowCanvasNode>(
		[],
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	useEffect(() => {
		if (activeView !== "workflows") return;
		const wf = WORKFLOWS[activeWorkflow];
		if (!wf) return;
		setNodes(wf.nodes);
		setEdges(
			wf.edges.map((e) => ({
				...e,
				sourceHandle: "output",
				targetHandle: "input",
				type: "workflow",
				...EDGE_STYLE,
			})),
		);
	}, [activeWorkflow, activeView, setNodes, setEdges]);

	return (
		<div className="mx-auto max-w-[90vw] min-w-225 relative">
			<div
				className="rounded-xl border border-border bg-card overflow-hidden"
				style={{ boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)" }}
			>
				<div
					className="flex"
					style={{ minHeight: 720, height: "clamp(720px, 75vh, 720px)" }}
				>
					<LeftSidebar
						activeWorkflow={activeWorkflow}
						setActiveWorkflow={setActiveWorkflow}
						activeView={activeView}
						setActiveView={setActiveView}
					/>

					<div className="flex-1 flex flex-col min-w-0">
						<header
							className="flex items-center justify-between gap-2 border-b border-border px-4 shrink-0"
							style={{ height: 44 }}
						>
							<div className="flex items-center gap-3">
								<button
									type="button"
									className="text-muted-foreground hover:text-foreground transition-colors"
								>
									<HugeiconsIcon
										icon={PanelLeftIcon}
										strokeWidth={2}
										className="size-4"
									/>
								</button>
								<div
									className="px-2.5 py-1 rounded-md text-sm tracking-wide"
									style={{ background: "var(--accent)" }}
								>
									{WORKFLOW_LABELS[activeWorkflow] ?? activeWorkflow}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity min-w-30"
									style={{ background: "var(--primary-gradient)" }}
								>
									<HugeiconsIcon icon={Rocket01Icon} className="size-3.5" />
									Publish
								</button>
							</div>
						</header>

						<div className="flex-1 flex min-h-0">
							<div className="flex-1 relative min-w-0">
								{activeView === "workflows" ? (
									<WorkflowCanvas
										nodes={nodes}
										edges={edges}
										onNodesChange={onNodesChange}
										onEdgesChange={onEdgesChange}
									/>
								) : (
									<LogsView />
								)}
							</div>
							{activeView === "workflows" && <RightSidebar />}
						</div>
					</div>
				</div>
			</div>
			<div
				className="absolute inset-y-0 right-0 w-32 pointer-events-none z-10"
				style={{
					background: "linear-gradient(to right, transparent, black)",
				}}
			/>
		</div>
	);
}
