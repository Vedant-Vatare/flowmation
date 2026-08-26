/* biome-ignore-all lint/suspicious/noArrayIndexKey: token order stable */
import { X } from "lucide-react";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { cn } from "@/lib/utils";
import {
	EXPRESSION_TOKEN_CLASS,
	tokenizeExpression,
} from "@/utils/expressions";

export type InspectorNeighbor = {
	id: string;
	name: string;
};

type NodeInspectorProps = {
	node: WorkflowCanvasNode;
	incoming?: InspectorNeighbor[];
	outgoing?: InspectorNeighbor[];
	onClose: () => void;
	className?: string;
};

function isFieldVisible(
	field: WorkflowCanvasNode["data"]["parameters"][number],
	allParams: WorkflowCanvasNode["data"]["parameters"],
): boolean {
	if (!field.dependsOn?.length) return true;
	return field.dependsOn.every((dep) => {
		const depParam = allParams.find((p) => p.name === dep.parameter);
		const val = depParam?.value;
		return dep.values.includes(val as never);
	});
}

function resolveDropdownLabel(
	field: WorkflowCanvasNode["data"]["parameters"][number],
	value: unknown,
): string {
	if (!field.options?.length || value == null || value === "")
		return String(value ?? "");
	const opt = field.options.find((o) => String(o.value) === String(value));
	return opt ? opt.label : String(value);
}

export const NodeInspector = ({
	node,
	onClose,
	className,
}: NodeInspectorProps) => {
	const { ui, name, parameters } = node.data;
	const Icon = ui.icon;

	const visibleParams = parameters.filter((p) => {
		if (!isFieldVisible(p, parameters)) return false;
		const v = p.value;
		if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) {
			if (typeof v === "object" && v !== null && !Array.isArray(v)) {
				if (Object.keys(v as Record<string, unknown>).length === 0)
					return false;
			} else {
				return false;
			}
		}
		if (typeof v === "object" && !Array.isArray(v) && v !== null) {
			return Object.keys(v as Record<string, unknown>).length > 0;
		}
		return true;
	});

	return (
		<aside
			aria-label={`Node details for ${name}`}
			className={cn(
				"inspector-enter flex max-h-full flex-col overflow-hidden rounded-lg border bg-background shadow-[0_10px_15px_-3px_rgb(0_0_0/0.1)]",
				className,
			)}
		>
			<div className="flex items-start gap-2.5 border-b px-3 py-3">
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
					<p className="truncate font-mono text-[10px] text-muted-foreground">
						{node.data.task}
					</p>
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

			<div className="min-h-0 flex-1 overflow-y-auto">
				{visibleParams.length ? (
					<div className="flex flex-col">
						{visibleParams.map((field) => {
							const rawValue = field.value;
							const isKeyValue = field.type === "key-value";
							const isArray = field.type === "array";

							if (
								isKeyValue &&
								rawValue &&
								typeof rawValue === "object" &&
								!Array.isArray(rawValue)
							) {
								const entries = Object.entries(
									rawValue as Record<string, string>,
								).filter(([k]) => k !== "");
								if (!entries.length) return null;
								return (
									<div
										key={field.name}
										className="flex flex-col gap-2 px-3 py-3 border-b border-border/50 last:border-b-0"
									>
										<div className="flex items-center gap-1">
											<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 leading-none select-none">
												{field.label}
											</span>
											{field.required ? (
												<span className="text-destructive text-[10px] leading-none">
													*
												</span>
											) : null}
										</div>
										<div className="flex flex-col gap-1.5">
											<div className="flex items-center pr-1">
												<span className="flex-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2">
													key
												</span>
												<span className="flex-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2">
													value
												</span>
											</div>
											{entries.map(([k, v]) => (
												<div
													key={k}
													className="flex min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-muted/50"
												>
													<span className="flex-1 min-w-0 truncate px-2.5 py-1.5 text-xs text-foreground">
														{k}
													</span>
													<span
														className="w-px shrink-0 self-stretch bg-border/60"
														aria-hidden
													/>
													<span className="flex-1 min-w-0 wrap-break-word px-2.5 py-1.5 text-xs text-foreground">
														{tokenizeExpression(String(v)).map((tok, i) =>
															tok.isExpr ? (
																<span
																	key={i}
																	className={EXPRESSION_TOKEN_CLASS}
																>
																	{tok.text}
																</span>
															) : (
																<span key={i}>{tok.text}</span>
															),
														)}
													</span>
												</div>
											))}
										</div>
										{field.description ? (
											<p className="text-[11px] leading-snug text-muted-foreground/60">
												{field.description}
											</p>
										) : null}
									</div>
								);
							}

							if (isArray && Array.isArray(rawValue)) {
								const items = (rawValue as unknown[]).filter(
									(v) => v != null && v !== "",
								) as string[];
								if (!items.length) return null;
								return (
									<div
										key={field.name}
										className="flex flex-col gap-2 px-3 py-3 border-b border-border/50 last:border-b-0"
									>
										<div className="flex items-center gap-1">
											<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 leading-none select-none">
												{field.label}
											</span>
											{field.required ? (
												<span className="text-destructive text-[10px] leading-none">
													*
												</span>
											) : null}
										</div>
										<div className="flex flex-col gap-1.5">
											{items.map((item, idx) => (
												<div
													key={idx}
													className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground wrap-break-word"
												>
													{tokenizeExpression(String(item)).map((tok, i) =>
														tok.isExpr ? (
															<span key={i} className={EXPRESSION_TOKEN_CLASS}>
																{tok.text}
															</span>
														) : (
															<span key={i}>{tok.text}</span>
														),
													)}
												</div>
											))}
										</div>
										{field.description ? (
											<p className="text-[11px] leading-snug text-muted-foreground/60">
												{field.description}
											</p>
										) : null}
									</div>
								);
							}

							let displayValue: string;
							if (field.type === "dropdown") {
								displayValue = resolveDropdownLabel(field, rawValue);
							} else if (
								field.type === "boolean" ||
								field.type === "checkbox"
							) {
								if (Array.isArray(rawValue)) {
									displayValue = (rawValue as string[]).join(", ");
								} else if (typeof rawValue === "boolean") {
									displayValue = rawValue ? "true" : "false";
								} else {
									displayValue = String(rawValue ?? "");
								}
							} else {
								displayValue = String(rawValue ?? "");
							}

							return (
								<div
									key={field.name}
									className="flex flex-col gap-2 px-3 py-3 border-b border-border/50 last:border-b-0"
								>
									<div className="flex items-center gap-1">
										<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 leading-none select-none">
											{field.label}
										</span>
										{field.required ? (
											<span className="text-destructive text-[10px] leading-none">
												*<span className="sr-only">required</span>
											</span>
										) : null}
									</div>
									<div className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground wrap-break-word whitespace-pre-wrap">
										{tokenizeExpression(displayValue).map((tok, i) =>
											tok.isExpr ? (
												<span key={i} className={EXPRESSION_TOKEN_CLASS}>
													{tok.text}
												</span>
											) : (
												<span key={i}>{tok.text}</span>
											),
										)}
									</div>
									<div className="min-h-5">
										{field.description ? (
											<p className="text-[11px] leading-snug text-muted-foreground/60">
												{field.description}
											</p>
										) : null}
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<p className="px-3 py-6 text-center text-xs text-muted-foreground">
						No parameters configured on this node.
					</p>
				)}
			</div>
		</aside>
	);
};
