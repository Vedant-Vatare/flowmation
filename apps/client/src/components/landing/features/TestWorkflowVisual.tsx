import executionPanel from "@/assets/execution-panel.png";
import workflowImage from "@/assets/live-test-worklfow.png";

export function TestWorkflowVisual() {
	return (
		<div className="relative w-full rounded-lg border border-border">
			<img
				src={workflowImage}
				alt="Workflow canvas showing a scheduled automation with conditional branching"
				className="w-full block"
				loading="lazy"
			/>

			<img
				src={executionPanel}
				alt="test workflow execution panel"
				className="absolute  drop-shadow-2xl object-contain"
				loading="lazy"
				style={{
					bottom: "-15%",
					right: "0%",
					width: "60%",
				}}
			/>

			<div
				aria-hidden="true"
				className="absolute top-0 left-0 h-full pointer-events-none"
				style={{
					width: "25%",
					background:
						"linear-gradient(to right, var(--background) 0%, transparent 100%)",
				}}
			/>
		</div>
	);
}
