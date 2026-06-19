import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Integrations } from "@/components/landing/Integrations";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";

export function LandingPage() {
	return (
		<div className="min-h-screen bg-sidebar overflow-x-hidden">
			<Navbar />
			<Hero />
			<Features />
			<Integrations />
			<Pricing />
			<Footer />
		</div>
	);
}
