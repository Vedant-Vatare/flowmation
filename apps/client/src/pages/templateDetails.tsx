import { WorkflowCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
	TemplateData,
	WorkflowConnection,
	WorkflowNode,
} from "@nodebase/shared";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Tag, Users } from "lucide-react";
import type { PublicTemplate } from "@/apis/templates";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FlowCanvas } from "@/components/workflow-editor/canvas/FlowCanvas";
import {
	useGetPublicTemplates,
	useGetTemplate,
	useGetTemplateData,
} from "@/queries/templates";
import { Route } from "@/routes/templates/$templateId";
import { isUserAuthenticated } from "@/utils/auth";
import {
	getTemplateAppsUsed,
	toCanvasEdges,
	toCanvasNodes,
} from "@/utils/nodes/nodes.utils";

type TemplateDetailsProps = {
	template: PublicTemplate;
	templateData: TemplateData;
};

const TemplateDetails = ({ template, templateData }: TemplateDetailsProps) => {
	const canvasNodes = toCanvasNodes(templateData.nodes as WorkflowNode[]);
	const canvasEdges = toCanvasEdges(
		templateData.connections as WorkflowConnection[],
	);
	const authenticated = isUserAuthenticated();
	const apps = getTemplateAppsUsed(templateData.nodes as WorkflowNode[]);

	return (
		<div className="min-h-screen bg-sidebar overflow-x-hidden">
			<Navbar showLandingLinks={false} />

			<main className="mx-auto w-full max-w-6xl px-6 pt-32 pb-20">
				<div className="mb-8">
					<Link
						to="/templates"
						className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-3.5" />
						All templates
					</Link>

					<div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex min-w-0 flex-col gap-1.5">
							<h1 className="text-2xl font-semibold tracking-tight text-foreground">
								{template.title}
							</h1>
							{template.category ? (
								<span className="text-sm text-muted-foreground">
									{template.category}
								</span>
							) : null}
						</div>

						<div className="flex shrink-0 items-center gap-3">
							<span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex">
								<Users className="size-4" />
								<span className="tabular-nums">{template.useCount}</span>
								{template.useCount === 1 ? "use" : "uses"}
							</span>
							{authenticated ? (
								<Button>Use this template</Button>
							) : (
								<Button asChild variant="outline">
									<Link to="/auth/login">Sign in to use</Link>
								</Button>
							)}
						</div>
					</div>
				</div>

				<div className="grid gap-8 lg:grid-cols-[1fr_320px]">
					<div className="min-w-0">
						<div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-card">
							<FlowCanvas
								nodes={canvasNodes}
								edges={canvasEdges}
								editable={false}
								fitView
								showBackground
								showMiniMap={false}
								className="h-full w-full"
							/>
						</div>

						{apps.length ? (
							<div className="mt-6 flex flex-col gap-2.5">
								<span className="text-xs font-medium text-muted-foreground">
									Apps used
								</span>
								<div className="flex flex-wrap gap-2">
									{apps.map((app) => {
										const AppIcon = app.icon;
										return (
											<span
												key={app.name}
												className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-foreground"
											>
												<AppIcon className="size-4" />
												{app.name}
											</span>
										);
									})}
								</div>
							</div>
						) : null}
					</div>

					<aside className="flex flex-col gap-6">
						<div className="flex flex-col gap-3">
							<h2 className="text-sm font-medium text-foreground">
								About this template
							</h2>
							{template.description ? (
								<p className="text-sm leading-relaxed text-muted-foreground">
									{template.description}
								</p>
							) : (
								<p className="text-sm italic text-muted-foreground">
									No description provided.
								</p>
							)}
						</div>

						<div className="flex flex-col gap-2 text-sm text-muted-foreground">
							<div className="flex items-center justify-between">
								<span>Nodes</span>
								<span className="font-medium tabular-nums text-foreground">
									{template.nodeCount ?? "–"}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Uses</span>
								<span className="font-medium tabular-nums text-foreground">
									{template.useCount}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Created</span>
								<span className="font-medium text-foreground">
									{format(new Date(template.createdAt), "MMM d, yyyy")}
								</span>
							</div>
						</div>

						{template.tags?.length ? (
							<>
								<Separator />
								<div className="flex flex-col gap-2.5">
									<span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
										<Tag className="size-3.5" />
										Tags
									</span>
									<div className="flex flex-wrap gap-1.5">
										{template.tags.map((tag) => (
											<span
												key={tag}
												className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
											>
												{tag}
											</span>
										))}
									</div>
								</div>
							</>
						) : null}

						<Separator />

						<div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
							<span className="flex items-center gap-1.5 font-medium">
								<Calendar className="size-3.5" />
								Details
							</span>
							<span>Created by {template.createdBy}</span>
						</div>
					</aside>
				</div>
			</main>
		</div>
	);
};

export const TemplateDetailsPage = () => {
	const { templateId } = Route.useParams();
	const { data: template, isLoading: templateLoading } = useGetTemplate(templateId);
	const { data: templateData, isLoading: dataLoading } = useGetTemplateData(templateId);
	const { data: allTemplates } = useGetPublicTemplates();

	const isLoading = templateLoading || dataLoading;

	const related = (() => {
		if (!template) return [];
		return (allTemplates ?? [])
			.filter(
				(t) =>
					t.id !== template.id &&
					t.category === template.category &&
					t.isActive,
			)
			.slice(0, 4);
	})();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-sidebar overflow-x-hidden">
				<Navbar showLandingLinks={false} />
				<main className="mx-auto w-full max-w-6xl px-6 pt-32 pb-20">
					<Skeleton className="h-4 w-28" />
					<div className="mt-4 flex items-center justify-between">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-9 w-36" />
					</div>
					<div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
						<Skeleton className="aspect-[16/9] w-full rounded-lg" />
						<div className="flex flex-col gap-4">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-4/5" />
							<Skeleton className="h-3 w-2/3" />
						</div>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (!template) {
		return (
			<div className="min-h-screen bg-sidebar overflow-x-hidden">
				<Navbar showLandingLinks={false} />
				<main className="flex flex-col items-center justify-center gap-3 px-6 pt-32 pb-20 text-center">
					<HugeiconsIcon
						icon={WorkflowCircle01Icon}
						className="size-10 text-muted-foreground/40"
					/>
					<p className="text-sm font-medium text-foreground">
						Template not found
					</p>
					<Link to="/templates">
						<Button variant="outline" size="sm">
							Back to templates
						</Button>
					</Link>
				</main>
				<Footer />
			</div>
		);
	}

	if (!templateData) {
		return (
			<div className="min-h-screen bg-sidebar overflow-x-hidden">
				<Navbar showLandingLinks={false} />
				<main className="flex flex-col items-center justify-center gap-3 px-6 pt-32 pb-20 text-center">
					<HugeiconsIcon
						icon={WorkflowCircle01Icon}
						className="size-10 text-muted-foreground/40"
					/>
					<p className="text-sm font-medium text-foreground">
						This template has no workflow yet
					</p>
					<Link to="/templates">
						<Button variant="outline" size="sm">
							Back to templates
						</Button>
					</Link>
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<>
			<TemplateDetails template={template} templateData={templateData} />
			{related.length ? (
				<div className="mx-auto w-full max-w-6xl px-6 pb-20">
					<div className="mb-6 flex items-center justify-between">
						<h2 className="text-xl font-semibold tracking-tight text-foreground">
							More in {template.category}
						</h2>
						<Link
							to="/templates"
							className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							View all
						</Link>
					</div>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{related.map((t) => (
							<Link
								key={t.id}
								to="/templates/$templateId"
								params={{ templateId: t.id }}
								className="text-left"
							>
								<TemplateCard template={t} />
							</Link>
						))}
					</div>
				</div>
			) : null}
			<Footer />
		</>
	);
};
