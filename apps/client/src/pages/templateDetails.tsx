import { WorkflowCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
	TemplateData,
	WorkflowConnection,
	WorkflowNode,
} from "@nodebase/shared";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MousePointerClick, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicTemplate } from "@/apis/templates";
import BrandIcon from "@/assets/icons/flowmation_logo_light.svg";
import VerifiedBadge from "@/assets/icons/verified-badge.png";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { NodeInspector } from "@/components/templates/NodeInspector";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { FlowCanvas } from "@/components/workflow-editor/canvas/FlowCanvas";
import {
	useGetPublicTemplates,
	useGetTemplate,
	useGetTemplateData,
} from "@/queries/templates";
import { Route } from "@/routes/templates/$templateId";
import { isUserAuthenticated } from "@/utils/auth";
import { toCanvasEdges, toCanvasNodes } from "@/utils/nodes/nodes.utils";
import {
	getTemplateIntegrations,
	getTriggerKind,
	getTriggerLabel,
} from "@/utils/templates";

type SectionLabelProps = {
	children: React.ReactNode;
};

const SectionLabel = ({ children }: SectionLabelProps) => (
	<h2 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
		{children}
	</h2>
);

type TemplateDetailsProps = {
	template: PublicTemplate;
	templateData: TemplateData;
};

const TemplateDetails = ({ template, templateData }: TemplateDetailsProps) => {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	const canvasNodes = useMemo(
		() => toCanvasNodes(templateData.nodes as WorkflowNode[]),
		[templateData.nodes],
	);
	const canvasEdges = useMemo(
		() => toCanvasEdges(templateData.connections as WorkflowConnection[]),
		[templateData.connections],
	);

	const authenticated = isUserAuthenticated();
	const apps = getTemplateIntegrations(template);
	const trigger = getTriggerKind(template);
	const visibleApps = apps.slice(0, 3);
	const extraApps = apps.length - visibleApps.length;

	const selectedNode = canvasNodes.find((n) => n.id === selectedNodeId) ?? null;
	const neighbors = useMemo(() => {
		if (!selectedNodeId) return { incoming: [], outgoing: [] };
		const nameById = new Map(
			templateData.nodes.map((n) => [n.id ?? "", n.name]),
		);
		const nameFor = (id: string) => nameById.get(id) ?? id;
		return {
			incoming: templateData.connections
				.filter((c) => c.targetId === selectedNodeId)
				.map((c) => ({ id: c.sourceId, name: nameFor(c.sourceId) })),
			outgoing: templateData.connections
				.filter((c) => c.sourceId === selectedNodeId)
				.map((c) => ({ id: c.targetId, name: nameFor(c.targetId) })),
		};
	}, [selectedNodeId, templateData.nodes, templateData.connections]);

	useEffect(() => {
		if (!selectedNodeId) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setSelectedNodeId(null);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [selectedNodeId]);

	const inspector = (className: string) =>
		selectedNode ? (
			<NodeInspector
				key={selectedNode.id}
				node={selectedNode}
				incoming={neighbors.incoming}
				outgoing={neighbors.outgoing}
				onClose={() => setSelectedNodeId(null)}
				className={className}
			/>
		) : null;

	return (
		<main className="mx-auto w-full max-w-7xl px-6 pt-21 pb-20">
			<Link
				to="/templates"
				className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
			>
				<ArrowLeft className="size-3.5" />
				All templates
			</Link>

			<div className="flex flex-wrap items-center gap-3">
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
						{extraApps > 0 ? (
							<span className="inline-flex size-7 items-center justify-center rounded-full border bg-muted text-[10px] font-medium text-muted-foreground">
								+{extraApps}
							</span>
						) : null}
					</div>
				) : null}
				{trigger ? (
					<span className="inline-flex shrink-0 items-center rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
						{getTriggerLabel(trigger)}
					</span>
				) : null}
			</div>

			<h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-4xl">
				{template.title}
			</h1>

			<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
					{template.category ? (
						<span className="font-semibold text-foreground">
							{template.category}
						</span>
					) : null}
					{template.category && template.nodeCount != null ? (
						<span aria-hidden="true" className="text-muted-foreground/60">
							·
						</span>
					) : null}
					{template.nodeCount != null ? (
						<span className="tabular-nums">
							{template.nodeCount} {template.nodeCount === 1 ? "step" : "steps"}
						</span>
					) : null}
					<span aria-hidden="true" className="text-muted-foreground/60">
						·
					</span>
					<TooltipProvider>
						<Tooltip delayDuration={150}>
							<TooltipTrigger asChild>
								<span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-all duration-200 hover:border-foreground/20 hover:shadow-md hover:scale-[1.02] cursor-default">
									<img
										src={BrandIcon}
										alt=""
										className="size-3.5 rounded-sm"
										aria-hidden="true"
									/>
									Flowmation
									<img
										src={VerifiedBadge}
										alt=""
										className="size-4 object-contain shrink-0"
										aria-hidden="true"
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent side="top" sideOffset={8} className="px-2.5 py-1">
								<span className="text-xs font-medium">
									Official template by Flowmation
								</span>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				<div className="shrink-0">
					{authenticated ? (
						<Button
							variant="outline"
							className="bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm dark:bg-white dark:text-zinc-900 dark:border-zinc-200 dark:hover:bg-zinc-50"
						>
							Use this template
						</Button>
					) : (
						<Button asChild variant="outline">
							<Link to="/auth/login">Sign in to use</Link>
						</Button>
					)}
				</div>
			</div>

			<div className="relative mt-8">
				<div className="template-preview relative h-[60vh] max-h-160 min-h-105 overflow-hidden rounded-lg border bg-card">
					<FlowCanvas
						nodes={canvasNodes}
						edges={canvasEdges}
						editable={false}
						previewSelectable
						fitView
						fitViewOptions={{
							duration: 0,
							padding: 0.1,
							minZoom: 0.15,
							maxZoom: 1.25,
						}}
						showBackground
						showMiniMap={false}
						className="h-full w-full"
						onNodeClick={(_, node) => setSelectedNodeId(node.id)}
						onPaneClick={() => setSelectedNodeId(null)}
					/>
					{!selectedNode && canvasNodes.length > 0 ? (
						<p className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
							<MousePointerClick className="size-3.5" aria-hidden="true" />
							Select a node to inspect what it does
						</p>
					) : null}
				</div>

				{inspector(
					"mt-3 max-h-80 max-lg:relative lg:absolute lg:inset-y-4 lg:right-4 lg:mt-0 lg:w-84 lg:max-h-[calc(100%-2rem)]",
				)}
			</div>

			<div className="mt-12 space-y-10">
				<section className="max-w-prose">
					<SectionLabel>About this template</SectionLabel>
					<p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
						{template.description || "No description provided."}
					</p>
				</section>

				{apps.length ? (
					<section>
						<SectionLabel>Apps used</SectionLabel>
						<div className="mt-3 flex flex-wrap gap-2">
							{apps.map((app) => {
								const Icon = app.ui.icon;
								return (
									<span
										key={app.key}
										className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
									>
										<Icon className="size-4" />
										{app.label}
									</span>
								);
							})}
						</div>
					</section>
				) : null}

				{template.tags?.length ? (
					<section>
						<SectionLabel>Tags</SectionLabel>
						<div className="mt-3 flex flex-wrap gap-1.5">
							{template.tags.map((tag) => (
								<span
									key={tag}
									className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
								>
									#{tag}
								</span>
							))}
						</div>
					</section>
				) : null}
			</div>
		</main>
	);
};

export const TemplateDetailsPage = () => {
	const { templateId } = Route.useParams();
	const {
		data: template,
		isLoading: templateLoading,
		isError: templateError,
		refetch: refetchTemplate,
	} = useGetTemplate(templateId);
	const {
		data: templateData,
		isLoading: dataLoading,
		isError: dataError,
		refetch: refetchData,
	} = useGetTemplateData(templateId);
	const { data: allTemplates } = useGetPublicTemplates();

	const isLoading = templateLoading || dataLoading;
	const isError = templateError || dataError;

	const related = useMemo(() => {
		if (!template) return [];
		const seen = new Set<string>();
		return (allTemplates ?? [])
			.filter((t) => {
				if (seen.has(t.id)) return false;
				seen.add(t.id);
				return (
					t.id !== template.id && t.category === template.category && t.isActive
				);
			})
			.slice(0, 6);
	}, [allTemplates, template]);

	if (isError && !isLoading) {
		return (
			<div className="flex min-h-screen flex-col bg-background">
				<Navbar showLandingLinks={false} />
				<main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-20 text-center">
					<SearchX className="size-8 text-muted-foreground" />
					<p className="text-sm font-medium text-foreground">
						Couldn't load this template
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetchTemplate();
							refetchData();
						}}
					>
						Try again
					</Button>
				</main>
				<Footer />
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex min-h-screen flex-col bg-background">
				<Navbar showLandingLinks={false} />
				<main className="mx-auto w-full max-w-7xl px-6 pt-8 pb-20">
					<Skeleton className="h-4 w-28" />
					<div className="mt-5 flex items-start justify-between">
						<div>
							<Skeleton className="h-7 w-40 rounded-full" />
							<Skeleton className="mt-4 h-9 w-72" />
							<Skeleton className="mt-3 h-3 w-56" />
						</div>
						<Skeleton className="h-9 w-36" />
					</div>
					<div className="relative mt-8">
						<Skeleton className="h-[60vh] max-h-160 min-h-105 w-full rounded-lg" />
					</div>
					<div className="mt-12 space-y-10">
						<div>
							<Skeleton className="h-3 w-36" />
							<Skeleton className="mt-3 h-3 w-full max-w-prose" />
							<Skeleton className="mt-2 h-3 w-4/5 max-w-prose" />
						</div>
						<div>
							<Skeleton className="h-3 w-24" />
							<div className="mt-3 flex gap-2">
								<Skeleton className="h-7 w-28 rounded-full" />
								<Skeleton className="h-7 w-24 rounded-full" />
								<Skeleton className="h-7 w-32 rounded-full" />
							</div>
						</div>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (!template) {
		return (
			<div className="flex min-h-screen flex-col bg-background">
				<Navbar showLandingLinks={false} />
				<main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-20 text-center">
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
			<div className="flex min-h-screen flex-col bg-background">
				<Navbar showLandingLinks={false} />
				<main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-20 text-center">
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
		<div className="flex min-h-screen flex-col bg-background">
			<Navbar showLandingLinks={false} />
			<TemplateDetails template={template} templateData={templateData} />

			{related.length ? (
				<div className="mx-auto w-full max-w-7xl flex-1 px-6 pb-20">
					<div className="mb-5 flex items-center justify-between">
						<h2 className="text-xl font-semibold tracking-tight text-foreground">
							More in {template.category}
						</h2>
						<Link
							to="/templates"
							className="rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						>
							View all
						</Link>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
						{related.map((t) => (
							<Link
								key={t.id}
								to="/templates/$templateId"
								params={{ templateId: t.id }}
								className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
							>
								<TemplateCard template={t} />
							</Link>
						))}
					</div>
				</div>
			) : null}
			<Footer />
		</div>
	);
};
