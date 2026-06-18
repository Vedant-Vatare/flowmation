import { Hero } from "@/components/landing/Hero";
import { Integrations } from "@/components/landing/Integrations";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";

export function LandingPage() {
	return (
		<div className="min-h-screen bg-sidebar overflow-x-hidden">
			<Navbar />
			<Hero />
			<Integrations />
			<Pricing />
		</div>
	);
}
