import {
	DashboardSquare01Icon,
	DiscoverCircleIcon,
	Key01Icon,
	Settings01Icon,
	TimelineListIcon,
	User03Icon,
	Workflow,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import {
	ChevronRight,
	ChevronUp,
	KeyRound,
	LogOut,
	Shield,
	Sun,
	UserRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { logOutUserApi } from "@/apis/auth";
import BrandIcon from "@/assets/icons/flowmation_temp.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { WorkflowHeaderActions } from "@/components/workflow-editor/header/WorkflowHeaderActions";
import { WorkflowNameSection } from "@/components/workflow-editor/header/WorkflowNameSection";
import { useCurrentUserQuery } from "@/queries/auth";
import { useUserWorkflowQuery } from "@/queries/userWorkflows";
import { clearAuthCookie, isUserAuthenticated } from "@/utils/auth";

export const Route = createFileRoute("/_mainLayout")({
	beforeLoad: () => {
		const isAuthenticated = isUserAuthenticated();
		if (!isAuthenticated) {
			throw redirect({ to: "/auth/login" });
		}
	},
	component: Layout,
});

function NavItem({
	to,
	label,
	icon: Icon,
	badge = 0,
}: {
	to: string;
	label: string;
	icon: IconSvgElement;
	badge?: number;
}) {
	const { location } = useRouterState();
	const active =
		to === "/settings"
			? location.pathname.startsWith("/settings") &&
				!location.pathname.startsWith("/settings/credentials")
			: location.pathname.startsWith(to);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={active} tooltip={label}>
				<Link to={to}>
					<HugeiconsIcon icon={Icon} strokeWidth={2} />

					<span>{label}</span>
				</Link>
			</SidebarMenuButton>
			{badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
		</SidebarMenuItem>
	);
}

function AppSidebar() {
	const { data: userWorkflows } = useUserWorkflowQuery();
	const { data: user } = useCurrentUserQuery();
	const { isMobile, state: sidebarState } = useSidebar();
	const [signOutOpen, setSignOutOpen] = useState(false);
	const [signingOut, setSigningOut] = useState(false);
	const accountButton = useRef<HTMLButtonElement>(null);
	async function signOut() {
		if (signingOut) return;
		setSigningOut(true);
		try {
			await logOutUserApi();
			await clearAuthCookie();
			window.location.href = "/auth/login";
		} catch {
			toast.error("Could not sign out. Try again.");
			setSigningOut(false);
		}
	}

	const userInitials = user?.name
		.trim()
		.split(/\s+/)
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<Sidebar collapsible="icon">
			<SidebarRail />
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							asChild
							className="hover:bg-background py-3"
						>
							<Link to="/dashboard" className="py-0.5 p-1">
								<div className="flex flex-col gap-0.5 leading-none">
									<div className="flex max-h-9 max-w-9 gap-2 items-center ">
										<img src={BrandIcon} alt="flowmation logo" />
										<span className="text-md">Flowmation</span>
									</div>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarMenu className="gap-2">
						<NavItem
							to="/dashboard"
							label="Dashboard"
							icon={DashboardSquare01Icon}
						/>
						<SidebarMenuItem>
							<Collapsible defaultOpen className="group/collapsible">
								<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip="Workflows">
										<HugeiconsIcon icon={Workflow} strokeWidth={2} />
										<span>Workflows</span>
										<ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub className="border-l-2 border-accent pl-0.5">
										{userWorkflows?.map((workflow) => (
											<SidebarMenuSubItem key={workflow.id}>
												<SidebarMenuSubButton className="px-1.5" asChild>
													<Link
														to="/workflow/$workflowId"
														params={{ workflowId: workflow.id }}
													>
														<span className="truncate">{workflow.name}</span>
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</Collapsible>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<NavItem
						to="/settings/credentials"
						label="Credentials"
						icon={Key01Icon}
					/>
					<NavItem to="/logs" label="Logs" icon={TimelineListIcon} />
					<NavItem
						to="/templates"
						label="Templates"
						icon={DiscoverCircleIcon}
					/>
					<NavItem to="/settings" label="Settings" icon={Settings01Icon} />
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									ref={accountButton}
									tooltip={user?.name || "Account"}
									aria-label="Account menu"
									className="min-w-0 gap-2.5 border-t border-sidebar-border rounded-none pt-3 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar className="size-7 rounded-lg">
										<AvatarFallback className="rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground text-xs font-medium">
											{userInitials || (
												<HugeiconsIcon icon={User03Icon} className="size-3.5" />
											)}
										</AvatarFallback>
									</Avatar>
									<span className="min-w-0 flex-1 truncate text-left text-sm font-medium group-data-[collapsible=icon]:hidden">
										{user?.name || "Account"}
									</span>
									<ChevronUp className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side={
									isMobile
										? "bottom"
										: sidebarState === "collapsed"
											? "right"
											: "top"
								}
								sideOffset={8}
								className="w-64 max-w-[calc(100vw-2rem)] [&_[data-slot=dropdown-menu-item]]:focus:bg-muted [&_[data-slot=dropdown-menu-item]]:focus:text-foreground"
								align="start"
							>
								<div className="px-2 py-2">
									<p className="truncate text-sm font-medium">
										{user?.name || "Account"}
									</p>
									<p
										className="mt-1 truncate text-xs text-muted-foreground"
										title={user?.email}
									>
										{user?.email}
									</p>
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to="/settings">
										<UserRound />
										Account
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/settings/appearance">
										<Sun />
										Appearance
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/settings/security">
										<Shield />
										Security
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/settings/credentials">
										<KeyRound />
										Credentials
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onSelect={() => setSignOutOpen(true)}
								>
									<LogOut className="mr-2 size-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
				<Dialog
					open={signOutOpen}
					onOpenChange={(open) => {
						if (!signingOut) setSignOutOpen(open);
					}}
				>
					<DialogContent
						showCloseButton={false}
						onCloseAutoFocus={(event) => {
							event.preventDefault();
							accountButton.current?.focus();
						}}
					>
						<DialogHeader>
							<DialogTitle>Sign out?</DialogTitle>
							<DialogDescription className="wrap-break-word">
								Signed in as{" "}
								<span className="font-medium text-foreground">
									{user?.name || "your account"}
								</span>
								.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								disabled={signingOut}
								onClick={() => setSignOutOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="secondary"
								className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/30"
								disabled={signingOut}
								onClick={() => void signOut()}
							>
								{signingOut ? "Signing out…" : "Sign out"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</SidebarFooter>
		</Sidebar>
	);
}

function Layout() {
	return (
		<SidebarProvider
			sidebarId="main-layout-nav"
			defaultWidth={256}
			minWidth={120}
			maxWidth={275}
			collapseThreshold={20}
		>
			<AppSidebar />
			<main className="flex flex-col flex-1 h-svh overflow-hidden">
				<header className="flex h-(--main-header-height) shrink-0 items-center justify-between gap-2 border-b px-4">
					<div className="flex min-w-0 gap-3 items-center">
						<SidebarTrigger className="-ml-1 text-muted-foreground" />
						<WorkflowNameSection />
					</div>

					<WorkflowHeaderActions />
				</header>
				<div className="flex-1 min-h-0">
					<Outlet />
				</div>
			</main>
		</SidebarProvider>
	);
}
