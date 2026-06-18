import { motion, useInView } from "motion/react";
import { useRef } from "react";
import BrandIcon from "@/assets/icons/flowmation_logo_light.svg";

const footerLinks = [
	{
		title: "Product",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "Integrations", href: "#integrations" },
			{ label: "Pricing", href: "#pricing" },
			{ label: "Changelog", href: "/changelog" },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "Documentation", href: "/docs" },
			{ label: "API Reference", href: "/docs/api" },
			{ label: "Community", href: "/community" },
			{ label: "Blog", href: "/blog" },
		],
	},
	{
		title: "Company",
		links: [
			{ label: "About", href: "/about" },
			{ label: "Privacy", href: "/privacy" },
			{ label: "Terms", href: "/terms" },
			{ label: "Contact", href: "/contact" },
		],
	},
];

export function Footer() {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-50px" });

	return (
		<footer ref={ref} className="border-t border-border">
			<div className="mx-auto max-w-6xl px-6 py-16">
				<motion.div
					className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-14"
					initial={{ opacity: 0, y: 16 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
				>
					<div className="col-span-2 sm:col-span-1">
						<div className="flex items-center gap-2.5 mb-4">
							<img src={BrandIcon} alt="" className="h-5 w-5 opacity-60" />
							<span className="text-sm font-medium text-foreground">
								Flowmation
							</span>
						</div>
						<p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px]">
							Workflow automation for developers. Build, debug, and ship
							automations with clarity.
						</p>
					</div>

					{footerLinks.map((group) => (
						<div key={group.title}>
							<h4 className="text-[13px] font-medium text-foreground mb-4">
								{group.title}
							</h4>
							<ul className="flex flex-col gap-2.5">
								{group.links.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-150"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</motion.div>

				<motion.div
					className="flex items-center justify-between pt-8 border-t border-border"
					initial={{ opacity: 0 }}
					animate={isInView ? { opacity: 1 } : {}}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
				>
					<span className="text-[12px] text-muted-foreground/60">
						&copy; 2026 Flowmation. All rights reserved.
					</span>
				</motion.div>
			</div>
		</footer>
	);
}
