import {
	DashboardSquare01Icon,
	DiscoverCircleIcon,
	Settings01Icon,
	TimelineListIcon,
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
import { ChevronRight, ChevronsUpDown, LogOut } from "lucide-react";
import BrandIcon from "@/assets/icons/flowmation_temp.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
} from "@/components/ui/sidebar";
import { WorkflowHeaderActions } from "@/components/workflow-editor/header/WorkflowHeaderActions";
import { useUserWorkflowQuery } from "@/queries/userWorkflows";

export const Route = createFileRoute("/_mainLayout")({
	beforeLoad: () => {
		const token = localStorage.getItem("token");
		if (!token) {
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
	const active = location.pathname.startsWith(to);

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
					<NavItem to="/logs" label="Logs" icon={TimelineListIcon} />
					<NavItem
						to="/Templates"
						label="Templates"
						icon={DiscoverCircleIcon}
					/>
					<NavItem to="/settings" label="Settings" icon={Settings01Icon} />
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar className="size-7 rounded-lg">
										<AvatarFallback className="rounded-lg bg-violet-100 text-indigo-500 text-xs font-semibold">
											JD
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col gap-0.5 leading-none text-left">
										<span className="font-medium text-sm">Jane Doe</span>
										<span className="text-xs text-muted-foreground">
											jane@example.com
										</span>
									</div>
									<ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" className="w-56" align="start">
								<DropdownMenuItem className="text-destructive focus:text-destructive">
									<LogOut className="mr-2 size-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
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
					<SidebarTrigger className="-ml-1" />
					<WorkflowHeaderActions />
				</header>
				<div className="flex-1 min-h-0">
					<Outlet />
				</div>
			</main>
		</SidebarProvider>
	);
}
