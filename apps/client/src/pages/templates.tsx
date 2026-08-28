import { Link } from "@tanstack/react-router";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { FilterRail } from "@/components/templates/FilterRail";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useGetPublicTemplates } from "@/queries/templates";
import {
	getTemplateIntegrations,
	matchesTriggerFilter,
	type TriggerKind,
} from "@/utils/templates";

const FALLBACK_NODE_COUNT = 99;
const NAVBAR_OFFSET = "88px";

const CardSkeleton = () => (
	<div className="flex min-h-37 flex-col rounded-lg border bg-card p-4">
		<div className="flex items-center justify-between">
			<div className="flex -space-x-1.5">
				<Skeleton className="size-7 rounded-full" />
				<Skeleton className="size-7 rounded-full" />
			</div>
			<Skeleton className="h-5 w-14 rounded-full" />
		</div>
		<Skeleton className="mt-3 h-4 w-3/4" />
		<Skeleton className="mt-2 h-3 w-full" />
		<Skeleton className="mt-1 h-3 w-5/6" />
		<div className="mt-auto flex gap-2 pt-3">
			<Skeleton className="h-3 w-20" />
			<Skeleton className="h-3 w-12" />
		</div>
	</div>
);

const RailSkeleton = () => (
	<div className="flex flex-col gap-8">
		<div className="space-y-3">
			<Skeleton className="h-3 w-16" />
			<div className="flex flex-wrap gap-1.5">
				{Array.from({ length: 8 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
					<Skeleton key={i} className="h-7 w-20 rounded-full" />
				))}
			</div>
		</div>
		<div className="space-y-3">
			<Skeleton className="h-3 w-20" />
			<Skeleton className="h-8 w-full rounded-full" />
		</div>
		<div className="space-y-2">
			<Skeleton className="h-3 w-20" />
			{Array.from({ length: 6 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
				<Skeleton key={i} className="h-7 w-full rounded-md" />
			))}
		</div>
	</div>
);

const TemplateSearch = ({
	query,
	onChange,
}: {
	query: string;
	onChange: (v: string) => void;
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [focused, setFocused] = useState(false);
	const isMobile = useIsMobile();
	const placeholder = isMobile
		? "Search templates..."
		: "Search by outcome, app, or trigger...";

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() !== "k" || e.altKey || e.shiftKey) return;
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<div className="group relative w-full">
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-150 group-focus-within:text-foreground" />
			<Input
				ref={inputRef}
				value={query}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						if (query) onChange("");
						else inputRef.current?.blur();
					}
				}}
				placeholder={placeholder}
				aria-label="Search templates"
				aria-keyshortcuts="Control+K Meta+K"
				className={cn(
					"h-10 rounded-full border-input bg-card pl-9 text-sm shadow-xs",
					query ? "pr-10" : "pr-16",
				)}
			/>
			{query ? (
				<button
					type="button"
					onClick={() => {
						onChange("");
						inputRef.current?.focus();
					}}
					aria-label="Clear search"
					className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					<X className="size-4" />
				</button>
			) : (
				<kbd
					className={cn(
						"pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground sm:block",
						focused && "opacity-60",
					)}
				>
					{/Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘K" : "Ctrl K"}
				</kbd>
			)}
		</div>
	);
};

type SortOption = "popular" | "newest" | "simplest";
const SORT_OPTIONS: SortOption[] = ["popular", "newest", "simplest"];

export const TemplatesPage = () => {
	const {
		data: templates,
		isLoading,
		isError,
		refetch,
	} = useGetPublicTemplates();

	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string | null>(null);
	const [trigger, setTrigger] = useState<TriggerKind | null>(null);
	const [sort, setSort] = useState<SortOption>("popular");
	const [showDrawer, setShowDrawer] = useState(false);

	useEffect(() => {
		const p = new URLSearchParams(window.location.search);
		const q = p.get("q");
		const cat = p.get("category");
		const tr = p.get("trigger") as TriggerKind | null;
		const s = p.get("sort") as SortOption | null;
		if (q) setQuery(q);
		if (cat) setCategory(cat);
		if (tr && (["webhook", "schedule", "manual"] as const).includes(tr))
			setTrigger(tr);
		if (s && (SORT_OPTIONS as readonly string[]).includes(s)) setSort(s);
	}, []);

	useEffect(() => {
		const p = new URLSearchParams();
		if (query.trim()) p.set("q", query.trim());
		if (category) p.set("category", category);
		if (trigger) p.set("trigger", trigger);
		if (sort !== "popular") p.set("sort", sort);
		const qs = p.toString();
		const url = qs
			? `${window.location.pathname}?${qs}`
			: window.location.pathname;
		const timeout = window.setTimeout(
			() => window.history.replaceState(null, "", url),
			300,
		);
		return () => window.clearTimeout(timeout);
	}, [query, category, trigger, sort]);

	const dedupedTemplates = useMemo(() => {
		if (!templates) return [];
		const seen = new Map<string, (typeof templates)[number]>();
		for (const t of templates) {
			if (!seen.has(t.id)) seen.set(t.id, t);
		}
		return Array.from(seen.values());
	}, [templates]);

	const categories = useMemo(() => {
		const map = new Map<string, number>();
		for (const t of dedupedTemplates) {
			if (t.category) map.set(t.category, (map.get(t.category) ?? 0) + 1);
		}
		return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
	}, [dedupedTemplates]);

	const filtered = useMemo(() => {
		if (!dedupedTemplates.length) return [];
		const q = query.trim().toLowerCase();

		const withParsedDates = dedupedTemplates.map((t) => {
			const appLabels = getTemplateIntegrations(t)
				.map((a) => a.label)
				.join(" ");
			return {
				template: t,
				createdAtMs: new Date(t.createdAt).getTime(),
				searchableText:
					`${t.title} ${t.description ?? ""} ${t.tags.join(" ")} ${t.category ?? ""} ${appLabels}`.toLowerCase(),
			};
		});

		let out = withParsedDates
			.filter(({ template, searchableText }) => {
				const matchesCategory = !category || template.category === category;
				const matchesTrigger = matchesTriggerFilter(template, trigger);
				const matchesQuery = !q || searchableText.includes(q);
				return matchesCategory && matchesTrigger && matchesQuery;
			})
			.map(({ template, createdAtMs }) => ({ template, createdAtMs }));

		if (sort === "popular") {
			out = [...out].sort(
				(a, b) => (b.template.useCount ?? 0) - (a.template.useCount ?? 0),
			);
		} else if (sort === "newest") {
			out = [...out].sort((a, b) => b.createdAtMs - a.createdAtMs);
		} else if (sort === "simplest") {
			out = [...out].sort(
				(a, b) =>
					(a.template.nodeCount ?? FALLBACK_NODE_COUNT) -
					(b.template.nodeCount ?? FALLBACK_NODE_COUNT),
			);
		}
		return out.map((x) => x.template);
	}, [dedupedTemplates, query, category, trigger, sort]);

	const hasActive = Boolean(query.trim() || category || trigger);

	const clearFilters = () => {
		setQuery("");
		setCategory(null);
		setTrigger(null);
		setSort("popular");
	};

	const activeChips = useMemo(() => {
		const chips: Array<{ id: string; label: string; onClear: () => void }> = [];
		if (query.trim())
			chips.push({
				id: "q",
				label: `“${query.trim()}”`,
				onClear: () => setQuery(""),
			});
		if (category)
			chips.push({
				id: "cat",
				label: category,
				onClear: () => setCategory(null),
			});
		if (trigger) {
			const trigLabel = trigger.charAt(0).toUpperCase() + trigger.slice(1);
			chips.push({
				id: "trig",
				label: trigLabel,
				onClear: () => setTrigger(null),
			});
		}
		return chips;
	}, [query, category, trigger]);

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<Navbar showLandingLinks={false} />

			<main className="flex-1 overflow-x-clip">
				<div className="border-b  my-6">
					<div className="mx-auto w-full max-w-7xl px-6 py-24 pb-18">
						<div className="max-w-2xl mx-auto text-center">
							<h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl">
								Start from how you work.
							</h1>
						</div>
					</div>
				</div>

				<div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-6">
					<div className="flex items-start gap-8">
						<aside
							className="hidden w-66 shrink-0 lg:sticky lg:top-22 lg:block lg:self-start lg:max-h-[calc(100dvh-88px-16px)] lg:overflow-y-auto lg:overscroll-contain lg:pr-3 lg:pb-6 thin-scrollbar"
							style={{ top: NAVBAR_OFFSET } as React.CSSProperties}
						>
							<div className="pr-2 py-1">
								{isLoading ? (
									<RailSkeleton />
								) : (
									<FilterRail
										categories={categories}
										selectedCategory={category}
										onSelectCategory={setCategory}
										selectedTrigger={trigger}
										onSelectTrigger={setTrigger}
										onClearAll={clearFilters}
										hasActiveFilters={hasActive}
									/>
								)}
							</div>
						</aside>

						<section className="min-w-0 flex-1">
							<div className="flex flex-col gap-3">
								<div className="flex gap-2">
									<div className="flex-1">
										<TemplateSearch query={query} onChange={setQuery} />
									</div>
									<Button
										variant="outline"
										className="shrink-0 lg:hidden"
										onClick={() => setShowDrawer((v) => !v)}
										aria-expanded={showDrawer}
										aria-controls="mobile-filters"
									>
										<SlidersHorizontal className="size-4" />
										Filters
										{hasActive
											? ` · ${Number(!!query.trim()) + Number(!!category) + Number(!!trigger)}`
											: ""}
									</Button>
								</div>

								{showDrawer ? (
									<div
										id="mobile-filters"
										className="rounded-lg border bg-card p-4 lg:hidden"
									>
										<FilterRail
											categories={categories}
											selectedCategory={category}
											onSelectCategory={setCategory}
											selectedTrigger={trigger}
											onSelectTrigger={setTrigger}
											onClearAll={clearFilters}
											hasActiveFilters={hasActive}
										/>
										<div className="mt-4 flex justify-end">
											<Button
												size="sm"
												variant="secondary"
												onClick={() => setShowDrawer(false)}
											>
												Done
											</Button>
										</div>
									</div>
								) : null}

								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
										{activeChips.length ? (
											activeChips.map((chip) => (
												<span
													key={chip.id}
													className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm"
												>
													{chip.label}
													<button
														type="button"
														aria-label={`Remove ${chip.label}`}
														onClick={chip.onClear}
														className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
													>
														<X className="size-3" />
													</button>
												</span>
											))
										) : (
											<span className="text-xs text-muted-foreground">
												{isLoading
													? "Loading templates…"
													: `${filtered.length} templates`}
												{!isLoading && hasActive ? " · filtered" : ""}
											</span>
										)}
										{activeChips.length ? (
											<button
												type="button"
												onClick={clearFilters}
												className="ml-1 text-xs font-medium text-muted-foreground hover:text-foreground"
											>
												Clear all
											</button>
										) : null}
									</div>

									<div className="flex shrink-0 items-center gap-2">
										{/* biome-ignore lint/a11y/useSemanticElements: pill group styling requires div */}
										<div
											className="inline-flex rounded-full border bg-muted p-1"
											role="group"
											aria-label="Sort"
										>
											{SORT_OPTIONS.map((k) => (
												<button
													key={k}
													type="button"
													aria-pressed={sort === k}
													onClick={() => setSort(k)}
													className={cn(
														"rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
														sort === k
															? "bg-card text-foreground shadow-sm border border-border"
															: "text-muted-foreground hover:text-foreground",
													)}
												>
													{k}
												</button>
											))}
										</div>
									</div>
								</div>

								<Separator className="mt-1" />
							</div>

							<div className="mt-6">
								{isLoading ? (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
										{Array.from({ length: 9 }).map((_, i) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
											<CardSkeleton key={i} />
										))}
									</div>
								) : null}

								{isError ? (
									<div className="flex flex-col items-center gap-3 py-20 text-center">
										<SearchX className="size-8 text-muted-foreground" />
										<p className="text-sm font-medium">
											Couldn't load templates
										</p>
										<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
											Something went wrong loading the library. Your filters are
											preserved, so you can retry.
										</p>
										<Button
											variant="outline"
											size="sm"
											onClick={() => refetch()}
										>
											Try again
										</Button>
									</div>
								) : null}

								{!isLoading && !isError && filtered.length === 0 ? (
									<div className="flex flex-col items-center gap-3 py-20 text-center">
										<SearchX className="size-8 text-muted-foreground" />
										<p className="text-sm font-medium">No templates found</p>
										<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
											{hasActive
												? `No results for ${[query.trim() ? `“${query.trim()}”` : null, category ?? null, trigger ?? null].filter(Boolean).join(" · ")}. Try a broader search or clear filters.`
												: "Templates will show up here once they're published."}
										</p>
										{hasActive ? (
											<Button
												variant="outline"
												size="sm"
												onClick={clearFilters}
											>
												Clear filters
											</Button>
										) : null}
									</div>
								) : null}

								{!isLoading && !isError && filtered.length > 0 ? (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
										{filtered.map((template) => (
											<Link
												key={template.id}
												to="/templates/$templateId"
												params={{ templateId: template.id }}
												className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg"
											>
												<TemplateCard template={template} />
											</Link>
										))}
									</div>
								) : null}
							</div>

							{!isLoading && !isError && filtered.length > 0 ? (
								<div className="mt-10 flex flex-col items-center gap-3 rounded-lg border bg-muted/30 px-6 py-8 text-center">
									<p className="text-sm font-medium text-foreground">
										Don’t see what you need?
									</p>
									<p className="max-w-md text-xs leading-relaxed text-muted-foreground">
										Start from scratch and build any workflow with the visual
										canvas. Every integration is still at your fingertips.
									</p>
									<Button asChild variant="outline" size="sm" className="mt-1">
										<Link to="/dashboard">Create blank workflow</Link>
									</Button>
								</div>
							) : null}
						</section>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
};
