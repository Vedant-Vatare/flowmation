import { WorkflowCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Users } from "lucide-react";
import type { PublicTemplate } from "@/apis/templates";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TemplateCardProps = {
	template: PublicTemplate;
	className?: string;
};

export const TemplateCard = ({ template, className }: TemplateCardProps) => (
	<Card
		className={cn(
			"group overflow-hidden border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-muted-foreground/10",
			className,
		)}
	>
		<div className="relative aspect-video overflow-hidden bg-muted">
			{template.thumbnail ? (
				<img
					src={template.thumbnail}
					alt={template.title}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
				/>
			) : (
				<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-card">
					<HugeiconsIcon
						icon={WorkflowCircle01Icon}
						strokeWidth={1.5}
						className="size-9 text-muted-foreground/40"
					/>
					<span className="text-xs font-medium text-muted-foreground/70">
						Preview coming soon
					</span>
				</div>
			)}
		</div>

		<div className="flex flex-col p-4">
			<h3 className="text-sm font-semibold leading-snug">{template.title}</h3>

			{template.description ? (
				<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
					{template.description}
				</p>
			) : null}

			<div className="mt-auto flex items-center gap-2 pt-3">
				{template.nodeCount != null ? (
					<Badge
						variant="secondary"
						className="px-2 py-0.5 text-[11px] font-medium"
					>
						{template.nodeCount} {template.nodeCount === 1 ? "node" : "nodes"}
					</Badge>
				) : null}
				{template.category ? (
					<Badge
						variant="outline"
						className="px-2 py-0.5 text-[11px] font-medium"
					>
						{template.category}
					</Badge>
				) : null}
				<span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
					<Users className="size-3.5" />
					{template.useCount}
				</span>
			</div>
		</div>
	</Card>
);
