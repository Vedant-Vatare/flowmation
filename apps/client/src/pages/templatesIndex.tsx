import { Link } from "@tanstack/react-router";
import { Search, SearchX, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetPublicTemplates } from "@/queries/templates";

const CardSkeleton = () => (
	<div className="overflow-hidden rounded-lg border bg-card">
		<Skeleton className="aspect-[16/10] w-full rounded-none" />
		<div className="space-y-2.5 p-4">
			<Skeleton className="h-4 w-2/3" />
			<Skeleton className="h-3 w-full" />
			<Skeleton className="h-3 w-4/5" />
			<div className="flex items-center gap-2 pt-1">
				<Skeleton className="h-4 w-12" />
				<Skeleton className="h-4 w-14" />
			</div>
		</div>
	</div>
);

type CategoryCloudProps = {
	categories: Array<[string, number]>;
	selected: string | null;
	total: number;
	loading: boolean;
	onSelect: (category: string | null) => void;
};

const CategoryCloud = ({
	categories,
	selected,
	total,
	loading,
	onSelect,
}: CategoryCloudProps) => {
	const chipClass = (active: boolean) =>
		cn(
			"inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
			active
				? "border-primary bg-accent text-foreground"
				: "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
		);

	return (
		<div
			className="flex flex-wrap gap-2.5"
			role="group"
			aria-label="Categories"
		>
			<button
				type="button"
				onClick={() => onSelect(null)}
				aria-pressed={!selected}
				className={chipClass(!selected)}
			>
				All
				{!loading ? (
					<span className="text-xs tabular-nums text-muted-foreground">
						{total}
					</span>
				) : null}
			</button>
			{loading
				? Array.from({ length: 6 }).map((_, i) => (
						<Skeleton
							key={i}
							className={cn("h-9 rounded-lg", i % 2 === 0 ? "w-24" : "w-20")}
						/>
					))
				: categories.map(([cat, count]) => (
						<button
							key={cat}
							type="button"
							onClick={() => onSelect(selected === cat ? null : cat)}
							aria-pressed={selected === cat}
							className={chipClass(selected === cat)}
						>
							{cat}
							<span className="text-xs tabular-nums text-muted-foreground">
								{count}
							</span>
						</button>
					))}
		</div>
	);
};

type TemplateSearchProps = {
	query: string;
	onChange: (value: string) => void;
};

type UADataNavigator = Navigator & {
	userAgentData?: { platform?: string };
};

const isMac = (() => {
	if (typeof navigator === "undefined") return false;
	const nav = navigator as UADataNavigator;
	const hint = nav.userAgentData?.platform?.toLowerCase() ?? "";
	if (hint) return hint.startsWith("mac");
	const platform = nav.platform?.toLowerCase() ?? "";
	if (platform) return /mac|iphone|ipad|ipod/.test(platform);
	return /Mac|iPhone|iPod|iPad/i.test(nav.userAgent ?? "");
})();

const TemplateSearch = ({ query, onChange }: TemplateSearchProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() !== "k" || e.altKey || e.shiftKey) return;
			const modPressed = isMac
				? e.metaKey && !e.ctrlKey
				: e.ctrlKey && !e.metaKey;
			if (modPressed) {
				e.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const clear = () => {
		onChange("");
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			if (query) onChange("");
			else inputRef.current?.blur();
		}
	};

	return (
		<div className="group relative w-full sm:w-80">
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-150 group-focus-within:text-foreground" />
			<Input
				ref={inputRef}
				value={query}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onKeyDown={handleKeyDown}
				placeholder="Search templates..."
				aria-label="Search templates"
				aria-keyshortcuts="Control+K Meta+K"
				className={cn("pl-9", query ? "pr-10" : "pr-16")}
			/>
			{query ? (
				<button
					type="button"
					onClick={clear}
					aria-label="Clear search"
					className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
				>
					<X className="size-4" />
				</button>
			) : (
				<kbd
					className={cn(
						"pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-opacity duration-150 motion-reduce:transition-none",
						focused && "opacity-60",
					)}
				>
					{isMac ? "⌘K" : "Ctrl K"}
				</kbd>
			)}
		</div>
	);
};

export const TemplatesIndexPage = () => {
	const {
		data: templates,
		isLoading,
		isError,
		refetch,
	} = useGetPublicTemplates();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string | null>(null);

	const categories = useMemo(() => {
		const map = new Map<string, number>();
		templates?.forEach((t) => {
			if (t.category) map.set(t.category, (map.get(t.category) ?? 0) + 1);
		});
		return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
	}, [templates]);

	const filtered = useMemo(() => {
		if (!templates) return [];
		const q = query.trim().toLowerCase();
		return templates.filter((t) => {
			const matchesCategory = !category || t.category === category;
			const matchesQuery =
				!q ||
				t.title.toLowerCase().includes(q) ||
				t.description?.toLowerCase().includes(q) ||
				t.tags.some((tag) => tag.toLowerCase().includes(q));
			return matchesCategory && matchesQuery;
		});
	}, [templates, query, category]);

	const hasFilters = Boolean(query.trim() || category);
	const clearFilters = () => {
		setQuery("");
		setCategory(null);
	};

	return (
		<div className="flex min-h-screen flex-col bg-sidebar overflow-x-hidden">
			<Navbar showLandingLinks={false} />

			<main className="flex-1">
				<div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-20">
					<div className="mb-10 flex flex-col gap-3">
						<div className="flex items-baseline gap-3">
							<h1 className="text-3xl font-semibold tracking-tight">
								Workflow Templates
							</h1>
							{!isLoading && templates ? (
								<span className="text-sm tabular-nums text-muted-foreground">
									{filtered.length === templates.length
										? `${templates.length.toLocaleString()}`
										: `${filtered.length.toLocaleString()} of ${templates.length.toLocaleString()}`}
								</span>
							) : null}
						</div>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Ready-made automation blueprints. Browse, compare, and start from
							something that already works.
						</p>
					</div>

					<div className="mb-10 flex flex-col gap-6">
						<TemplateSearch query={query} onChange={setQuery} />
						<CategoryCloud
							categories={categories}
							selected={category}
							total={templates?.length ?? 0}
							loading={isLoading}
							onSelect={setCategory}
						/>
					</div>

					{isLoading ? (
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<CardSkeleton key={i} />
							))}
						</div>
					) : null}

					{isError ? (
						<div className="flex flex-col items-center gap-3 py-24 text-center">
							<SearchX className="size-8 text-muted-foreground" />
							<p className="text-sm font-medium">Couldn’t load templates</p>
							<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
								Something went wrong while loading the library. Your search and
								category filter are still applied, so you can just retry.
							</p>
							<Button variant="outline" size="sm" onClick={() => refetch()}>
								Try again
							</Button>
						</div>
					) : null}

					{!isLoading && !isError && filtered.length === 0 ? (
						<div className="flex flex-col items-center gap-3 py-24 text-center">
							<SearchX className="size-8 text-muted-foreground" />
							<p className="text-sm font-medium">No templates found</p>
							<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
								{hasFilters
									? "Try a different search term, or clear your filters to see the full library."
									: "Templates will show up here once they’re published."}
							</p>
							{hasFilters ? (
								<Button variant="outline" size="sm" onClick={clearFilters}>
									Clear filters
								</Button>
							) : null}
						</div>
					) : null}

					{!isLoading && !isError && filtered.length > 0 ? (
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{filtered.map((template) => (
								<Link
									key={template.id}
									to="/templates/$id"
									params={{ id: template.id }}
									className="text-left"
								>
									<TemplateCard template={template} />
								</Link>
							))}
						</div>
					) : null}
				</div>
			</main>

			<Footer />
		</div>
	);
};
