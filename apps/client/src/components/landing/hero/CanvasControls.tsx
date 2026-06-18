import { useReactFlow, useViewport } from "@xyflow/react";
import { Maximize2, Minus, Play, Plus, Waypoints } from "lucide-react";

export function CanvasControls() {
	const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
	const viewport = useViewport();
	const zoom = Math.round((viewport.zoom || 1) * 100);

	return (
		<div className="absolute bottom-7 left-1/2 z-5 -translate-x-1/2">
			<div className="flex items-center gap-3">
				<div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-sidebar-accent px-1.5 py-1">
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => zoomOut()}
						title="Zoom out"
					>
						<Minus size={16} strokeWidth={2} />
					</button>
					<button
						type="button"
						className="wf-control-btn min-w-10 cursor-pointer rounded px-1 text-[0.8125rem] font-medium text-foreground border-none bg-transparent"
						onClick={() =>
							setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 })
						}
						title="Reset zoom to 100%"
					>
						{zoom}
					</button>
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => zoomIn()}
						title="Zoom in"
					>
						<Plus size={16} strokeWidth={2} />
					</button>
					<div className="mx-0.5 h-4 w-px bg-border" />
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => fitView({ padding: 0.3, duration: 250 })}
						title="Fit view"
					>
						<Maximize2 size={15} strokeWidth={2} />
					</button>
					<button
						type="button"
						className="wf-control-btn inline-flex size-7 items-center justify-center rounded-md border-none bg-transparent p-0 text-foreground cursor-pointer"
						onClick={() => fitView({ padding: 0.3, duration: 250 })}
						title="Auto layout"
					>
						<Waypoints size={15} strokeWidth={2} />
					</button>
				</div>
				<button
					type="button"
					className="inline-flex items-center gap-2 rounded-[calc(0.5rem-1.5px)] border border-primary/20 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 text-xs font-medium cursor-pointer"
				>
					<Play size={14} strokeWidth={2} className="text-primary" />
					Test Workflow
				</button>
			</div>
		</div>
	);
}
