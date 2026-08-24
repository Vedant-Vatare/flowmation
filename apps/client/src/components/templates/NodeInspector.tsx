import { X } from "lucide-react";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { cn } from "@/lib/utils";

export type InspectorNeighbor = {
	id: string;
	name: string;
};

type NodeInspectorProps = {
	node: WorkflowCanvasNode;
	incoming: InspectorNeighbor[];
	outgoing: InspectorNeighbor[];
	onClose: () => void;
	className?: string;
};

const isExpression = (value: string) => /\{\{[\s\S]*\}\}/.test(value);

function formatParamValue(value: unknown): string | null {
	if (value == null || value === "") return null;
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (Array.isArray(value)) {
		if (!value.length) return null;
		return value
			.map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
			.join(", ");
	}
	if (typeof value === "object") {
		const json = JSON.stringify(value);
		return json === "{}" ? null : json;
	}
	return String(value);
}

export const NodeInspector = ({
	node,
	incoming,
	outgoing,
	onClose,
	className,
}: NodeInspectorProps) => {
	const { ui, name, task, type, parameters } = node.data;
	const Icon = ui.icon;
	const visibleParams = parameters
		.map((p) => ({ label: p.label, value: formatParamValue(p.value) }))
		.filter((p): p is { label: string; value: string } => p.value !== null);

	return (
		<aside
			aria-label={`Node details for ${name}`}
			className={cn(
				"inspector-enter flex max-h-full flex-col overflow-hidden rounded-lg border bg-background shadow-[0_10px_15px_-3px_rgb(0_0_0/0.1)]",
				className,
			)}
		>
			<div className="flex items-start gap-2.5 border-b px-3.5 py-3">
				<span
					className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md"
					style={{ background: ui.background ?? "#6366f1" }}
					aria-hidden="true"
				>
					<Icon
						style={ui.branded ? {} : { color: ui.color ?? "#ffffff" }}
						className="size-4"
					/>
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium text-foreground">{name}</p>
					<div className="mt-1 flex flex-wrap items-center gap-1.5">
						<span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground capitalize">
							{type}
						</span>
						<code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
							{task}
						</code>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close node details"
					className="-m-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<X className="size-4" />
				</button>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
				<section>
					<h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
						Parameters
					</h3>
					{visibleParams.length ? (
						<dl className="mt-2 space-y-2">
							{visibleParams.map((p) => (
								<div key={p.label} className="text-xs leading-relaxed">
									<dt className="text-muted-foreground">{p.label}</dt>
									<dd
										className={cn(
											"mt-0.5 break-words text-foreground",
											isExpression(p.value) &&
												"rounded bg-primary/5 px-1.5 py-0.5 font-mono text-[11px] text-primary",
										)}
									>
										{p.value}
									</dd>
								</div>
							))}
						</dl>
					) : (
						<p className="mt-2 text-xs text-muted-foreground">
							No parameters configured on this node.
						</p>
					)}
				</section>

				{(incoming.length > 0 || outgoing.length > 0) && (
					<section className="mt-5">
						<h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
							Connections
						</h3>
						<ul className="mt-2 space-y-1.5">
							{incoming.map((n) => (
								<li
									key={`in-${n.id}`}
									className="flex items-center gap-2 text-xs text-muted-foreground"
								>
									<span aria-hidden="true" className="font-mono text-[10px]">
										←
									</span>
									<span className="truncate text-foreground">{n.name}</span>
								</li>
							))}
							{outgoing.map((n) => (
								<li
									key={`out-${n.id}`}
									className="flex items-center gap-2 text-xs text-muted-foreground"
								>
									<span aria-hidden="true" className="font-mono text-[10px]">
										→
									</span>
									<span className="truncate text-foreground">{n.name}</span>
								</li>
							))}
						</ul>
					</section>
				)}
			</div>
		</aside>
	);
};
