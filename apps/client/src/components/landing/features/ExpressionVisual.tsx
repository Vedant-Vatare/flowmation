import {
	ChevronDown,
	ChevronRight,
	Lightbulb,
	Pencil,
	Sparkles,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TOKENS = [
	{ text: "const", color: "var(--primary)" },
	{ text: " result", color: "var(--foreground)" },
	{ text: " = ", color: "var(--foreground)" },
	{ text: "input", color: "var(--primary)" },
	{ text: ".", color: "var(--foreground)" },
	{ text: "data", color: "var(--primary)" },
	{ text: ".", color: "var(--foreground)" },
	{ text: "map", color: "var(--primary)" },
	{ text: "(", color: "var(--foreground)" },
	{ text: "item", color: "var(--primary)" },
	{ text: " => ", color: "var(--foreground)" },
	{ text: "(", color: "var(--foreground)" },
];

const TOKENS_2 = [
	{ text: "  ", color: "var(--foreground)" },
	{ text: "const", color: "var(--primary)" },
	{ text: " trimmed", color: "var(--foreground)" },
	{ text: " = ", color: "var(--foreground)" },
	{ text: "item", color: "var(--primary)" },
	{ text: ".", color: "var(--foreground)" },
	{ text: "trim", color: "var(--primary)" },
	{ text: "()", color: "var(--foreground)" },
];

const TOKENS_3 = [
	{ text: "  ", color: "var(--foreground)" },
	{ text: "const", color: "var(--primary)" },
	{ text: " result", color: "var(--foreground)" },
	{ text: " = ", color: "var(--foreground)" },
	{ text: "trimmed", color: "var(--primary)" },
	{ text: ".", color: "var(--foreground)" },
	{ text: "length", color: "var(--primary)" },
	{ text: " > ", color: "var(--foreground)" },
	{ text: "0", color: "var(--primary)" },
	{ text: " ? ", color: "var(--foreground)" },
];

const TOKENS_4 = [
	{ text: "    ", color: "var(--foreground)" },
	{ text: "JSON", color: "var(--primary)" },
	{ text: ".", color: "var(--foreground)" },
	{ text: "parse", color: "var(--primary)" },
	{ text: "(trimmed)", color: "var(--foreground)" },
];

const TOKENS_5 = [
	{ text: "  : ", color: "var(--foreground)" },
	{ text: "null", color: "var(--primary)" },
	{ text: ";", color: "var(--foreground)" },
];

const TOKENS_6 = [{ text: ")))", color: "var(--foreground)" }];

const HELPERS = [
	{ name: "JSON.parse", description: "Parse JSON string" },
	{ name: "Date.now", description: "Current timestamp" },
	{ name: "Math.floor", description: "Round down number" },
	{ name: "String.trim", description: "Remove whitespace" },
];

function CodeLine({
	lineNum,
	tokens,
	isActive,
}: {
	lineNum: number;
	tokens: typeof TOKENS;
	isActive?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center font-mono text-[12px] leading-6 px-3",
				isActive && "bg-primary/5 border-l-2 border-primary",
			)}
		>
			<span className="w-8 text-right pr-3 text-muted-foreground/60 select-none text-[11px]">
				{lineNum}
			</span>
			<span className="flex-1">
				{tokens.map((token, i) => (
					<span
						key={`${lineNum}-${token.text.slice(0, 5)}-${i}`}
						style={{ color: token.color }}
					>
						{token.text}
					</span>
				))}
			</span>
		</div>
	);
}

function HelperChip({
	helper,
	index,
}: {
	helper: (typeof HELPERS)[number];
	index: number;
}) {
	return (
		<button
			type="button"
			className="flex items-center gap-1.5 px-2 py-1 text-[11px] bg-background border border-border rounded hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
			style={{ animationDelay: `${index * 100}ms` }}
		>
			<Zap className="size-2.5 text-primary" />
			<span className="font-medium">{helper.name}</span>
			<span className="text-muted-foreground hidden sm:inline">
				{helper.description}
			</span>
		</button>
	);
}

export function ExpressionVisual() {
	const [activeLine, setActiveLine] = useState(3);
	const [showPreview, setShowPreview] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setActiveLine((prev) => (prev < 7 ? prev + 1 : 2));
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="relative w-full h-full bg-background rounded-lg border border-border overflow-hidden">
			<div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium">Expression Editor</span>
					<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
						<Pencil className="size-2.5" />
						<span>JavaScript</span>
					</div>
				</div>
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						className="p-1 hover:bg-muted rounded-md transition-colors"
					>
						<Sparkles className="size-3 text-muted-foreground" />
					</button>
					<button
						type="button"
						className="p-1 hover:bg-muted rounded-md transition-colors"
					>
						<Lightbulb className="size-3 text-muted-foreground" />
					</button>
					<button
						type="button"
						className="p-1 hover:bg-muted rounded-md transition-colors"
					>
						<ChevronDown className="size-3 text-muted-foreground" />
					</button>
				</div>
			</div>

			<div className="relative">
				<div className="absolute left-0 top-0 bottom-0 w-10 border-r border-border bg-muted/30" />

				<div className="py-2">
					<CodeLine lineNum={1} tokens={TOKENS} isActive={activeLine === 1} />
					<CodeLine lineNum={2} tokens={TOKENS_2} isActive={activeLine === 2} />
					<CodeLine lineNum={3} tokens={TOKENS_3} isActive={activeLine === 3} />
					<CodeLine lineNum={4} tokens={TOKENS_4} isActive={activeLine === 4} />
					<CodeLine lineNum={5} tokens={TOKENS_5} isActive={activeLine === 5} />
					<CodeLine lineNum={6} tokens={TOKENS_6} isActive={activeLine === 6} />
				</div>
			</div>

			<div className="px-4 py-2 border-t border-border bg-muted/30">
				<div className="flex items-center gap-1.5 mb-2">
					<Lightbulb className="size-3 text-primary" />
					<span className="text-[10px] font-medium text-muted-foreground">
						Quick Insert
					</span>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{HELPERS.map((helper, i) => (
						<HelperChip
							key={`helper-${i}-${helper.name}`}
							helper={helper}
							index={i}
						/>
					))}
				</div>
			</div>

			{showPreview && (
				<div className="border-t border-border bg-(--muted)/30 p-3">
					<div className="flex items-center justify-between mb-1.5">
						<span className="text-[10px] font-medium text-muted-foreground">
							Preview
						</span>
						<button
							type="button"
							onClick={() => setShowPreview(false)}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<ChevronRight className="size-3" />
						</button>
					</div>
					<div className="font-mono text-[11px] bg-background rounded border border-border p-2 text-foreground">
						<div className="flex items-start gap-2">
							<span className="text-muted-foreground select-none">{">"}</span>
							<span className="text-primary">Output</span>
							<span className="text-muted-foreground">:</span>
							<span className="text-foreground">
								"{`{ "name": "John", "age": 30 }`}"
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
