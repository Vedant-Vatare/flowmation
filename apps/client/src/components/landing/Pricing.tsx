import { Link } from "@tanstack/react-router";
import { CheckIcon } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Button } from "../ui/button";

const freeFeatures = [
	"Unlimited workflows",
	"All integrations",
	"Real-time execution logs",
	"Community support",
];

const proFeatures = [
	"Priority execution",
	"Advanced analytics",
	"Email support",
	"Custom integrations",
];

export function Pricing() {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	return (
		<section ref={ref} id="pricing" className="px-6 py-28">
			<div className="mx-auto max-w-4xl">
				<motion.div
					className="text-center mb-14"
					initial={{ opacity: 0, y: 16 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
				>
					<h2
						className="font-semibold text-foreground tracking-tight mb-4"
						style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
					>
						Simple, transparent pricing
					</h2>
					<p className="text-muted-foreground text-[15px] max-w-md mx-auto leading-relaxed">
						Start free. Scale when you are ready.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
					<motion.div
						className="rounded-xl border border-border bg-card p-10 flex flex-col"
						initial={{ opacity: 0, y: 20 }}
						animate={isInView ? { opacity: 1, y: 0 } : {}}
						transition={{
							duration: 0.6,
							ease: [0.16, 1, 0.3, 1],
							delay: 0.1,
						}}
					>
						<div className="mb-8">
							<span className="text-sm font-medium text-foreground">Free</span>
							<div className="mt-4 flex items-baseline gap-1.5">
								<span
									className="font-semibold text-foreground"
									style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}
								>
									$0
								</span>
								<span className="text-sm text-muted-foreground">forever</span>
							</div>
						</div>

						<ul className="flex flex-col gap-3.5 mb-10 flex-1">
							{freeFeatures.map((feature) => (
								<li key={feature} className="flex items-center gap-3">
									<CheckIcon className="size-4 text-primary shrink-0" />
									<span className="text-[15px] text-muted-foreground">
										{feature}
									</span>
								</li>
							))}
						</ul>

						<Button variant="default" asChild>
							<Link to="/auth/signup"> Get Started</Link>
						</Button>
					</motion.div>

					<motion.div
						className="rounded-xl border border-border bg-card p-10 flex flex-col relative overflow-hidden"
						initial={{ opacity: 0, y: 20 }}
						animate={isInView ? { opacity: 1, y: 0 } : {}}
						transition={{
							duration: 0.6,
							ease: [0.16, 1, 0.3, 1],
							delay: 0.2,
						}}
					>
						<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

						<div className="mb-8">
							<div className="flex items-center gap-2.5">
								<span className="text-sm font-medium text-foreground">Pro</span>
								<span className="text-[11px] font-medium text-muted-foreground border border-border rounded-full px-2.5 py-0.5">
									Coming soon
								</span>
							</div>
							<div className="mt-3 flex items-baseline gap-1.5">
								<span
									className="font-semibold text-muted-foreground"
									style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}
								>
									--
								</span>
							</div>
						</div>

						<ul className="flex flex-col gap-3.5 mb-10 flex-1">
							{proFeatures.map((feature) => (
								<li key={feature} className="flex items-center gap-3">
									<div className="size-4 rounded-full border border-border shrink-0" />
									<span className="text-[15px] text-muted-foreground">
										{feature}
									</span>
								</li>
							))}
						</ul>

						<div className="inline-flex items-center justify-center text-sm font-medium px-5 py-3 rounded-lg border border-border text-muted-foreground cursor-default">
							Coming soon
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
