import {
	ActivityIcon,
	Alert02Icon,
	WorkflowCircle01Icon,
	ZapIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UserWorkflow } from "@nodebase/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useCreateUserWorkflowQuery,
	useUserWorkflowQuery,
} from "@/queries/userWorkflows";
import { getErrorMessage } from "@/utils/error";

const statusVariant: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	active: "default",
	inactive: "secondary",
	failed: "destructive",
	stopped: "secondary",
	running: "outline",
	executed: "secondary",
	cancelled: "secondary",
};

function formatDate(dateStr: string | undefined) {
	if (!dateStr) return "Never";
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

const getPlaceholderWorkflowName = (workflows: UserWorkflow[]) => {
	let count = 1;
	const name = "Untitled Workflow #";

	while (workflows.some((w) => w.name === `${name}${count}`)) count++;

	return `${name}${count}`;
};

const DashboardSkeleton = () => (
	<div className="flex flex-col gap-6" aria-busy="true">
		<output className="sr-only">Loading workflows.</output>
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
			{[1, 2, 3, 4].map((card) => (
				<Card key={card}>
					<CardHeader className="pb-2">
						<Skeleton className="h-5 w-24 max-w-full bg-muted motion-reduce:animate-none" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-9 w-16 bg-muted motion-reduce:animate-none" />
					</CardContent>
				</Card>
			))}
		</div>
		<Card aria-hidden="true">
			<CardHeader>
				<Skeleton className="h-5 w-36 bg-muted motion-reduce:animate-none" />
			</CardHeader>
			<CardContent className="space-y-4">
				{[1, 2, 3, 4, 5].map((row) => (
					<Skeleton
						key={row}
						className="h-8 w-full bg-muted motion-reduce:animate-none"
					/>
				))}
			</CardContent>
		</Card>
	</div>
);

export const Dashboard = () => {
	const {
		data: userWorkflows,
		isPending,
		isError,
		error,
		isFetching,
		refetch,
	} = useUserWorkflowQuery();
	const { mutateAsync: createWorkflow } = useCreateUserWorkflowQuery();
	const navigate = useNavigate();
	const [isCreating, setIsCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const creatingRef = useRef(false);
	const workflows = userWorkflows ?? [];

	const handleCreateWorkflow = async () => {
		if (!userWorkflows || creatingRef.current) return;
		creatingRef.current = true;
		setIsCreating(true);
		setCreateError(null);
		let newWorkflow: UserWorkflow | undefined;
		try {
			const workflowName = getPlaceholderWorkflowName(userWorkflows);
			newWorkflow = await createWorkflow(workflowName);
			await navigate({
				to: "/workflow/$workflowId",
				params: { workflowId: newWorkflow.id },
			});
		} catch (error) {
			setCreateError(
				newWorkflow
					? "Workflow created, but the editor could not open. Open it from the workflow list below."
					: getErrorMessage(
							error,
							"Could not create workflow. Please try again.",
						),
			);
		} finally {
			creatingRef.current = false;
			setIsCreating(false);
		}
	};

	const activeWorkflows = workflows.filter((w) => w.status === "active").length;

	const totalRuns = workflows.reduce((acc, w) => acc + w.executionCount, 0);
	const failedWorkflows = workflows.filter((w) => w.status === "failed").length;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
				<Button
					onClick={handleCreateWorkflow}
					disabled={!userWorkflows || isCreating}
					aria-busy={isCreating}
				>
					{isCreating ? (
						<Loader2
							className="size-4 motion-safe:animate-spin"
							aria-hidden="true"
						/>
					) : (
						<Plus className="size-4" aria-hidden="true" />
					)}
					{isCreating ? "Creating…" : "New Workflow"}
				</Button>
			</div>
			<Separator />
			{createError && (
				<p role="alert" className="text-sm text-destructive">
					{createError}
				</p>
			)}
			{isError && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
					<div role="alert" className="min-w-0 space-y-1">
						<p className="text-sm font-medium">
							{userWorkflows
								? "Could not update workflows"
								: "Could not load workflows"}
						</p>
						<p className="text-sm text-muted-foreground break-words">
							{getErrorMessage(error, "Check your connection and try again.")}
							{userWorkflows &&
								" Your last loaded workflows are still shown below."}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						disabled={isFetching}
						aria-busy={isFetching}
						onClick={() => void refetch({ cancelRefetch: false })}
					>
						{isFetching && (
							<Loader2
								className="size-4 motion-safe:animate-spin"
								aria-hidden="true"
							/>
						)}
						{isFetching ? "Retrying…" : "Try again"}
					</Button>
				</div>
			)}
			{isPending ? (
				<DashboardSkeleton />
			) : userWorkflows ? (
				<>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardDescription className="flex justify-between w-full">
									Total Workflows
									<HugeiconsIcon icon={WorkflowCircle01Icon} strokeWidth={2} />
								</CardDescription>
							</CardHeader>
							<CardContent>
								<AnimatedNumber
									className="text-3xl font-bold"
									springOptions={{
										bounce: 0.12,
										duration: 1000,
									}}
									value={workflows.length}
								/>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardDescription className="flex justify-between w-full">
									Active
									<HugeiconsIcon icon={ZapIcon} strokeWidth={2} />
								</CardDescription>
							</CardHeader>
							<CardContent>
								<AnimatedNumber
									className="text-3xl font-bold"
									springOptions={{
										bounce: 0.12,
										duration: 1000,
									}}
									value={activeWorkflows}
								/>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardDescription className="flex justify-between w-full">
									Total Runs
									<HugeiconsIcon icon={ActivityIcon} strokeWidth={2} />
								</CardDescription>
							</CardHeader>
							<CardContent>
								<AnimatedNumber
									className="text-3xl font-bold"
									springOptions={{
										bounce: 0.125,
										duration: 1000,
									}}
									value={totalRuns}
								/>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardDescription className="flex justify-between w-full">
									Failed Runs
									<HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
								</CardDescription>
							</CardHeader>
							<CardContent>
								<AnimatedNumber
									className="text-3xl font-bold"
									springOptions={{
										bounce: 0.12,
										duration: 1000,
									}}
									value={failedWorkflows}
								/>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-base flex gap-2 relative right-2">
								<span>
									<HugeiconsIcon icon={WorkflowCircle01Icon} strokeWidth={2} />
								</span>
								Your Workflows
							</CardTitle>
						</CardHeader>
						<CardContent className="px-1">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="hidden sm:table-cell">Runs</TableHead>
										<TableHead className="hidden md:table-cell">
											Last Run
										</TableHead>
										<TableHead className="hidden md:table-cell">
											Created
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{workflows.map((workflow) => (
										<TableRow key={workflow.id}>
											<TableCell className="max-w-38">
												<Link
													to={"/workflow/$workflowId"}
													params={{ workflowId: workflow.id }}
													className="font-medium hover:underline underline-offset-4 max-w-75 truncate block"
												>
													{workflow.name}
												</Link>
											</TableCell>
											<TableCell>
												<Badge variant={statusVariant[workflow.status]}>
													{workflow.status}
												</Badge>
											</TableCell>
											<TableCell className="hidden sm:table-cell text-muted-foreground">
												{workflow.executionCount}
											</TableCell>
											<TableCell className="hidden md:table-cell text-muted-foreground">
												{formatDate(workflow.lastExecutedAt)}
											</TableCell>
											<TableCell className="hidden md:table-cell text-muted-foreground">
												{formatDate(workflow.createdAt)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</>
			) : null}
		</div>
	);
};
