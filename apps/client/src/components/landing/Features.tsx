import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ExpressionVisual } from "./features/ExpressionVisual";
import { TemplateVisual } from "./features/TemplateVisual";
import { TestWorkflowVisual } from "./features/TestWorkflowVisual";

type Feature = {
	label: string;
	headline: string;
	description: string;
	bullets: string[];
	visual: React.ReactNode;
	cta?: { label: string; href: string };
};

const features: Feature[] = [
	{
		label: "Test Workflows",
		headline: "Test before you ship",
		description:
			"Run individual nodes without executing the full workflow. Catch errors, verify logic, and debug with precision.",
		bullets: [
			"Execute any single node in isolation",
			"Replay with mock data to test edge cases",
			"Inspect inputs and outputs at every step",
		],
		visual: <TestWorkflowVisual />,
	},
	{
		label: "Expressions",
		headline: "Shape data your way",
		description:
			"Reference outputs from any previous node inline. Write JavaScript expressions to transform data between steps.",
		bullets: [
			"Access any node's output with {{ $json.field }} syntax",
			"Preview results instantly before running",
		],
		visual: <ExpressionVisual />,
	},
	{
		label: "Templates",
		headline: "Start from proven patterns",
		description:
			"Browse community templates for common automation patterns. Clone, customize, and ship in minutes.",
		bullets: [
			"Clone and customize any template in one click",
			"Create and share your own with the community",
		],
		visual: <TemplateVisual />,
		cta: { label: "Browse templates", href: "/templates" },
	},
];

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-80px" });

	return (
		<div ref={ref} className="border-t border-border">
			<motion.div
				className="grid items-center gap-10 py-16 lg:grid-cols-[1fr_1.2fr]"
				initial={{ opacity: 0, y: 24 }}
				animate={isInView ? { opacity: 1, y: 0 } : {}}
				transition={{
					duration: 0.6,
					ease: [0.16, 1, 0.3, 1],
					delay: index * 0.05,
				}}
			>
				<div className="flex flex-col gap-5">
					<div
						className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
						style={{ letterSpacing: "0.08em" }}
					>
						{feature.label}
					</div>
					<h3
						className="font-semibold text-foreground tracking-tight leading-[1.1]"
						style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
					>
						{feature.headline}
					</h3>
					<p className="text-muted-foreground text-[15px] leading-relaxed max-w-md">
						{feature.description}
					</p>
					<ul className="flex flex-col gap-2.5">
						{feature.bullets.map((bullet) => (
							<li
								key={bullet}
								className="flex items-start gap-2.5 text-[14px] text-muted-foreground"
							>
								<svg
									className="mt-0.5 shrink-0"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M3 8.5L6.5 12L13 4"
										stroke="var(--primary)"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								<span>{bullet}</span>
							</li>
						))}
					</ul>
					{feature.cta && (
						<a
							href={feature.cta.href}
							className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary mt-1 hover:opacity-80 transition-opacity"
						>
							{feature.cta.label}
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M5 12h14" />
								<path d="m12 5 7 7-7 7" />
							</svg>
						</a>
					)}
				</div>

				<div className="w-full">{feature.visual}</div>
			</motion.div>
		</div>
	);
}

export function Features() {
	const ref = useRef<HTMLDivElement>(null);
	useInView(ref, { once: true, margin: "-100px" });

	return (
		<section ref={ref} id="features" className="px-6 py-24">
			<div className="mx-auto max-w-6xl">
				<div>
					{features.map((feature, i) => (
						<FeatureRow key={feature.label} feature={feature} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
