import { WorkflowCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Users } from "lucide-react";
import type { PublicTemplate } from "@/apis/templates";
import { cn } from "@/lib/utils";

type TemplateCardProps = {
	template: PublicTemplate;
	className?: string;
};

export const TemplateCard = ({ template, className }: TemplateCardProps) => (
	<article
		className={cn(
			"group flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-colors duration-150 hover:border-primary/40",
			className,
		)}
	>
		<div className="relative aspect-[16/10] overflow-hidden bg-muted">
			{template.thumbnail ? (
				<img
					src={template.thumbnail}
					alt={template.title}
					loading="lazy"
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
				/>
			) : (
<div className="flex h-full w-full items-center justify-center bg-muted">
				<HugeiconsIcon
					icon={WorkflowCircle01Icon}
					strokeWidth={1.5}
					className="size-8 text-muted-foreground/40"
				/>
			</div>
			)}
		</div>

		<div className="flex flex-1 flex-col p-4">
			<h3 className="text-sm font-medium leading-snug text-foreground">
				{template.title}
			</h3>

			{template.description ? (
				<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
					{template.description}
				</p>
			) : null}

			<div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted-foreground">
				{template.nodeCount != null ? (
					<span className="tabular-nums">
						{template.nodeCount} {template.nodeCount === 1 ? "node" : "nodes"}
					</span>
				) : null}
				<span className="inline-flex items-center gap-1">
					<Users className="size-3.5" />
					<span className="tabular-nums">{template.useCount}</span>
				</span>
				{template.category ? (
					<span className="ml-auto max-w-[45%] truncate">{template.category}</span>
				) : null}
			</div>
		</div>
	</article>
);