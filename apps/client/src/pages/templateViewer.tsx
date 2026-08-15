import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { WorkflowCircle01Icon } from "@hugeicons/core-free-icons";
import { ArrowLeft, Calendar, Sparkles, Tag, Users } from "lucide-react";
import type {
	TemplateData,
	Template,
	WorkflowNode,
	WorkflowConnection,
} from "@nodebase/shared";
import { format } from "date-fns";
import { Route } from "@/routes/templates/$id";
import { useGetTemplate, useGetTemplateData } from "@/queries/templates";
import { FlowCanvas } from "@/components/workflow-editor/canvas/FlowCanvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toCanvasEdges, toCanvasNodes } from "@/utils/nodes/nodes.utils";

type TemplateViewerProps = {
	template: Template & { id: string; nodeCount: number | null };
	templateData: TemplateData;
};

const TemplateViewer = ({ template, templateData }: TemplateViewerProps) => {
	const canvasNodes = toCanvasNodes(templateData.nodes as WorkflowNode[]);
	const canvasEdges = toCanvasEdges(
		templateData.connections as WorkflowConnection[],
	);

	return (
		<div className="flex h-full flex-col bg-background">
			<header className="flex items-center gap-3 border-b px-6 py-3">
				<Link to="/templates">
					<Button variant="ghost" size="icon-sm">
						<ArrowLeft className="size-4" />
					</Button>
				</Link>
				<div className="flex min-w-0 flex-col">
					<h1 className="truncate text-sm font-semibold">{template.title}</h1>
					{template.category ? (
						<span className="text-xs text-muted-foreground">
							{template.category}
						</span>
					) : null}
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Button variant="outline" size="sm" disabled>
						<Users className="size-3.5" />
						Use this template
					</Button>
				</div>
			</header>

			<div className="flex min-h-0 flex-1">
				<main className="relative min-w-0 flex-1">
					<FlowCanvas
						nodes={canvasNodes}
						edges={canvasEdges}
						editable={false}
						fitView
						showBackground
					/>
				</main>

				<aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l p-4">
					<div className="flex flex-col gap-1">
						<h2 className="text-sm font-semibold">About this template</h2>
						{template.description ? (
							<p className="text-xs leading-relaxed text-muted-foreground">
								{template.description}
							</p>
						) : (
							<p className="text-xs italic text-muted-foreground">
								No description provided.
							</p>
						)}
					</div>

					<div className="flex flex-wrap gap-2">
						{template.nodeCount != null ? (
							<Badge variant="secondary" className="px-2 py-0.5 text-[11px]">
								{template.nodeCount}{" "}
								{template.nodeCount === 1 ? "node" : "nodes"}
							</Badge>
						) : null}
						<Badge variant="outline" className="px-2 py-0.5 text-[11px]">
							<Users className="mr-1 size-3" />
							{template.useCount} uses
						</Badge>
					</div>

					{template.tags?.length ? (
						<div className="flex flex-col gap-1.5">
							<span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
								<Tag className="size-3" />
								Tags
							</span>
							<div className="flex flex-wrap gap-1.5">
								{template.tags.map((tag) => (
									<Badge key={tag} variant="outline" className="text-[11px]">
										{tag}
									</Badge>
								))}
							</div>
						</div>
					) : null}

					<Separator />

					<div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
						<span className="flex items-center gap-1 font-medium">
							<Calendar className="size-3" />
							Details
						</span>
						<span>Created by {template.createdBy}</span>
						<span>{format(new Date(template.createdAt), "MMM d, yyyy")}</span>
					</div>
				</aside>
			</div>
		</div>
	);
};

export const TemplateViewerPage = () => {
	const { id } = Route.useParams();
	const { data: template, isLoading: templateLoading } = useGetTemplate(id);
	const { data: templateData, isLoading: dataLoading } = useGetTemplateData(id);

	const isLoading = templateLoading || dataLoading;

	if (isLoading) {
		return (
			<div className="flex h-full flex-col bg-background">
				<header className="flex items-center gap-3 border-b px-6 py-3">
					<Skeleton className="h-8 w-8 rounded-md" />
					<Skeleton className="h-4 w-40" />
				</header>
				<div className="flex min-h-0 flex-1">
					<div className="flex-1 p-4">
						<Skeleton className="h-full w-full rounded-lg" />
					</div>
					<div className="w-72 shrink-0 border-l p-4">
						<div className="flex flex-col gap-3">
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-4/5" />
							<Skeleton className="h-5 w-16 rounded-full" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!template) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
				<HugeiconsIcon
					icon={WorkflowCircle01Icon}
					className="size-10 text-muted-foreground/40"
				/>
				<p className="text-sm font-medium">Template not found</p>
				<Link to="/templates">
					<Button variant="outline" size="sm">
						Back to templates
					</Button>
				</Link>
			</div>
		);
	}

	if (!templateData) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
				<Sparkles className="size-10 text-muted-foreground/40" />
				<p className="text-sm font-medium">This template has no workflow yet</p>
				<Link to="/templates">
					<Button variant="outline" size="sm">
						Back to templates
					</Button>
				</Link>
			</div>
		);
	}

	return <TemplateViewer template={template} templateData={templateData} />;
};
