import { Link } from "@tanstack/react-router";
import BrandIcon from "@/assets/icons/flowmation_logo_light.svg";

export function Navbar() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-6">
			<div className="flex items-center justify-between h-12 px-4 rounded-full border border-border bg-background/80 backdrop-blur-md w-full max-w-3xl">
				<Link to="/" className="flex items-center gap-2.5 pl-1">
					<img src={BrandIcon} alt="" className="h-5 w-5" />
					<span className="text-sm font-medium text-foreground">Flowmation</span>
				</Link>

				<nav className="flex items-center gap-1">
					<a
						href="#pricing"
						className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 px-3 py-1.5 rounded-full"
					>
						Pricing
					</a>
					<span className="text-[13px] font-medium text-muted-foreground/50 cursor-default px-3 py-1.5">
						Docs
					</span>
					<div className="w-px h-4 bg-border mx-1" />
					<a
						href="/auth/login"
						className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 px-3 py-1.5 rounded-full"
					>
						Log In
					</a>
					<a
						href="/auth/signup"
						className="text-[13px] font-medium px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-150"
					>
						Get Started
					</a>
				</nav>
			</div>
		</header>
	);
}
