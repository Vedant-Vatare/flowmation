import { HeroPanel } from "./HeroPanel";

export function Hero() {
	return (
		<section className="relative pt-32 pb-16 px-6 overflow-hidden bg-black">
			<div
				className="absolute inset-0 z-0"
				style={{
					background: `
						radial-gradient(ellipse 120% 80% at 70% 20%, rgba(255, 20, 147, 0.15), transparent 50%),
						radial-gradient(ellipse 100% 60% at 30% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
						radial-gradient(ellipse 90% 70% at 50% 0%, rgba(138, 43, 226, 0.18), transparent 65%),
						radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%)
					`,
				}}
			/>
			<div className="relative z-10 mx-auto max-w-5xl text-center">
				<h1
					className="font-semibold text-white leading-[1.1] tracking-tight"
					style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)" }}
				>
					The workflow automation platform
				</h1>
				<p
					className="mt-5 text-neutral-400 mx-auto"
					style={{
						fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
						maxWidth: 540,
						lineHeight: 1.6,
					}}
				>
					Build workflows on a canvas. Debug them in real time. Ship them in
					minutes.
				</p>
			</div>

			<div className="relative z-10 mt-14">
				<HeroPanel />
			</div>
		</section>
	);
}
