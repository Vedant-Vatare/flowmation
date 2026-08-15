import { Link } from "@tanstack/react-router";
import { SearchX, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useGetPublicTemplates } from "@/queries/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CardSkeleton = () => (
	<div className="overflow-hidden rounded-xl border bg-card">
		<Skeleton className="aspect-video w-full rounded-none" />
		<div className="space-y-2.5 p-4">
			<Skeleton className="h-4 w-2/3" />
			<Skeleton className="h-3 w-full" />
			<Skeleton className="h-3 w-4/5" />
			<div className="flex items-center gap-2 pt-1">
				<Skeleton className="h-5 w-14 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>
		</div>
	</div>
);

export const TemplatesIndexPage = () => {
	const { data: templates, isLoading, isError } = useGetPublicTemplates();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string | null>(null);

	const categories = useMemo(() => {
		const set = new Set<string>();
		templates?.forEach((t) => {
			if (t.category) set.add(t.category);
		});
		return Array.from(set).sort();
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

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<header className="border-b">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
					<Link
						to="/"
						className="flex items-center gap-2 text-sm font-semibold"
					>
						<Sparkles className="size-4 text-primary" />
						Flowmation
					</Link>
					<Link to="/auth/login">
						<Button variant="ghost" size="sm">
							Sign in
						</Button>
					</Link>
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
				<div className="mb-8 flex flex-col gap-5">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Workflow Templates
						</h1>
						<p className="mt-1.5 text-sm text-muted-foreground">
							Ready-made automation blueprints. Pick one and start from
							something that already works.
						</p>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search templates..."
							className="max-w-sm"
						/>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setCategory(null)}
								className={cn(
									"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
									!category
										? "border-primary bg-primary text-primary-foreground"
										: "border-border text-muted-foreground hover:bg-muted",
								)}
							>
								All
							</button>
							{categories.map((cat) => (
								<button
									key={cat}
									type="button"
									onClick={() =>
										setCategory(category === cat ? null : cat)
									}
									className={cn(
										"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
										category === cat
											? "border-primary bg-primary text-primary-foreground"
											: "border-border text-muted-foreground hover:bg-muted",
									)}
								>
									{cat}
								</button>
							))}
						</div>
					</div>
				</div>

				{isLoading ? (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<CardSkeleton key={i} />
						))}
					</div>
				) : null}

				{isError ? (
					<div className="flex flex-col items-center gap-3 py-20 text-center">
						<SearchX className="size-8 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							Couldn’t load templates. Please try again later.
						</p>
					</div>
				) : null}

				{!isLoading && !isError && filtered.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-20 text-center">
						<SearchX className="size-8 text-muted-foreground" />
						<p className="text-sm font-medium">No templates found</p>
						<p className="max-w-sm text-xs text-muted-foreground">
							{query || category
								? "Try a different search term or remove the category filter."
								: "Templates will show up here once they’re published."}
						</p>
					</div>
				) : null}

				{!isLoading && !isError && filtered.length > 0 ? (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
			</main>

			<footer className="border-t py-6">
				<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 text-xs text-muted-foreground">
					<span>Flowmation — self-hosted automation</span>
					<span>
						<Badge variant="outline" className="font-normal">
							{filtered.length} available
						</Badge>
					</span>
				</div>
			</footer>
		</div>
	);
};