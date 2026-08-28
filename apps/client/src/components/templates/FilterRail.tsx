import { cn } from "@/lib/utils";
import type { TriggerKind } from "@/utils/templates";

type FilterRailProps = {
	categories: Array<[string, number]>;
	selectedCategory: string | null;
	onSelectCategory: (c: string | null) => void;
	selectedTrigger: TriggerKind | null;
	onSelectTrigger: (t: TriggerKind | null) => void;
	onClearAll: () => void;
	hasActiveFilters: boolean;
};

const triggerOptions: Array<{ value: TriggerKind | null; label: string }> = [
	{ value: null, label: "All" },
	{ value: "webhook", label: "Webhook" },
	{ value: "schedule", label: "Schedule" },
	{ value: "manual", label: "Manual" },
];

export function FilterRail({
	categories,
	selectedCategory,
	onSelectCategory,
	selectedTrigger,
	onSelectTrigger,
	onClearAll,
	hasActiveFilters,
}: FilterRailProps) {
	return (
		<div className="flex flex-col gap-7">
			<div className="flex items-center justify-between">
				<h2 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
					Filters
				</h2>
				{hasActiveFilters ? (
					<button
						type="button"
						onClick={onClearAll}
						className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Clear all
					</button>
				) : null}
			</div>

			<div className="flex flex-col gap-3">
				<h3 className="text-xs font-medium text-foreground">How it starts</h3>
				{/* biome-ignore lint/a11y/useSemanticElements: pill group styling requires div */}
				<div
					className="inline-flex w-full rounded-full border bg-muted p-1.5 gap-0.5"
					role="group"
					aria-label="Trigger type"
				>
					{triggerOptions.map((opt) => {
						const active = selectedTrigger === opt.value;
						return (
							<button
								key={opt.label}
								type="button"
								aria-pressed={active}
								onClick={() => onSelectTrigger(opt.value)}
								className={cn(
									"flex-auto inline-flex items-center justify-center whitespace-nowrap px-0 mx-0 rounded-full  text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
									active
										? "bg-card text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{opt.label}
							</button>
						);
					})}
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<h3 className="text-xs font-medium text-foreground">Category</h3>
				<div className="flex flex-col gap-1">
					<button
						type="button"
						aria-pressed={!selectedCategory}
						onClick={() => onSelectCategory(null)}
						className={cn(
							"flex w-full items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
							!selectedCategory
								? "bg-accent text-accent-foreground"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						<span className="truncate">All categories</span>
					</button>
					{categories.map(([cat]) => {
						const active = selectedCategory === cat;
						return (
							<button
								key={cat}
								type="button"
								aria-pressed={active}
								onClick={() => onSelectCategory(active ? null : cat)}
								className={cn(
									"flex w-full items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
									active
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								)}
							>
								<span className="truncate">{cat}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
