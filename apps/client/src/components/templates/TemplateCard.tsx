import type { PublicTemplate } from "@/apis/templates";
import { cn } from "@/lib/utils";
import {
	getTriggerLabel,
	inferAppsForTemplate,
	inferTriggerForTemplate,
} from "@/utils/templates";

type TemplateCardProps = {
	template: PublicTemplate;
	className?: string;
};

export const TemplateCard = ({ template, className }: TemplateCardProps) => {
	const apps = inferAppsForTemplate(template);
	const trigger = inferTriggerForTemplate(template);
	const visibleApps = apps.slice(0, 3);
	const extraCount = apps.length - visibleApps.length;

	return (
		<article
			className={cn(
				"group relative flex h-full min-h-[148px] flex-col rounded-lg border bg-card p-4 transition-colors duration-150 hover:border-primary/30 focus-within:border-primary/30",
				className,
			)}
		>
			{/* Top row: stack icons + trigger */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center">
					{visibleApps.length ? (
						<div className="flex items-center -space-x-1.5">
							{visibleApps.map((app) => {
								const Icon = app.ui.icon;
								return (
									<span
										key={app.key}
										className="inline-flex size-7 items-center justify-center rounded-full border bg-background shadow-sm"
										aria-hidden="true"
										title={app.label}
									>
										<Icon className="size-3.5" />
									</span>
								);
							})}
							{extraCount > 0 ? (
								<span className="inline-flex size-7 items-center justify-center rounded-full border bg-muted text-[10px] font-medium text-muted-foreground">
									+{extraCount}
								</span>
							) : null}
						</div>
					) : (
						<span
							className="inline-flex size-7 items-center justify-center rounded-full border bg-muted"
							aria-hidden="true"
						>
							<span className="size-2 rounded-full bg-muted-foreground/30" />
						</span>
					)}
				</div>

				{trigger ? (
					<span className="inline-flex shrink-0 items-center rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
						{getTriggerLabel(trigger)}
					</span>
				) : null}
			</div>

			{/* Title */}
			<h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-foreground text-balance">
				{template.title}
			</h3>

			{/* Description */}
			{template.description ? (
				<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
					{template.description}
				</p>
			) : null}

			{/* Footer meta — category bolder + whiter for hierarchy */}
			<div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3 text-[11px] leading-none">
				{template.category ? (
					<span className="truncate text-xs font-semibold text-foreground">
						{template.category}
					</span>
				) : null}
				{template.category && template.nodeCount != null ? (
					<span className="text-muted-foreground/60">·</span>
				) : null}
				{template.nodeCount != null ? (
					<span className="tabular-nums text-muted-foreground">
						{template.nodeCount} {template.nodeCount === 1 ? "step" : "steps"}
					</span>
				) : null}
				{template.tags?.length ? (
					<>
						<span className="text-muted-foreground/60">·</span>
						<span className="truncate text-muted-foreground">
							{template.tags
								.slice(0, 2)
								.map((t) => `#${t}`)
								.join(" ")}
						</span>
					</>
				) : null}
			</div>

			{/* Hover affordance — not hover-only for function, but visual cue */}
			<span className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-150 group-hover:flex group-hover:opacity-100 group-focus-within:flex group-focus-within:opacity-100 [@media(hover:none)]:hidden">
				Use <span aria-hidden="true">→</span>
			</span>
		</article>
	);
};
