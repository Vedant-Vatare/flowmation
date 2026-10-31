import {
	ActivityIcon,
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
import { WorkflowImportButton } from "@/components/workflow-editor/WorkflowImportButton";
import {
	useCreateUserWorkflowQuery,
	useDashboardWorkflowsQuery,
} from "@/queries/userWorkflows";
import { getErrorMessage } from "@/utils/error";

function formatDate(dateStr: string | null | undefined) {
	if (!dateStr) return "Never";
	return new Date(dateStr).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const getPlaceholderWorkflowName = (
	workflows: Pick<UserWorkflow, "name">[],
) => {
	let count = 1;
	const name = "Untitled Workflow #";

	while (workflows.some((w) => w.name === `${name}${count}`)) count++;

	return `${name}${count}`;
};

const DashboardSkeleton = () => (
	<div aria-busy="true" className="space-y-4">
		<output className="sr-only">Loading workflows.</output>
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-3" aria-hidden="true">
			{[1, 2, 3].map((card) => (
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
		<div aria-hidden="true" className="space-y-4 rounded-md border p-4">
			{[1, 2, 3, 4, 5].map((row) => (
				<Skeleton
					key={row}
					className="h-8 w-full bg-muted motion-reduce:animate-none"
				/>
			))}
		</div>
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
	} = useDashboardWorkflowsQuery();
	const { mutateAsync: createWorkflow } = useCreateUserWorkflowQuery();
	const navigate = useNavigate();
	const [isCreating, setIsCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const creatingRef = useRef(false);
	const workflows = userWorkflows ?? [];
	const activeWorkflows = workflows.filter(
		(workflow) => workflow.status === "active",
	).length;
	const totalRuns = workflows.reduce(
		(total, workflow) => total + workflow.executionCount,
		0,
	);
	const summary = [
		{
			label: "Total Workflows",
			value: workflows.length,
			icon: WorkflowCircle01Icon,
			bounce: 0.12,
		},
		{ label: "Active", value: activeWorkflows, icon: ZapIcon, bounce: 0.12 },
		{
			label: "Total Runs",
			value: totalRuns,
			icon: ActivityIcon,
			bounce: 0.125,
		},
	];

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

	return (
		<div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
				<div className="flex flex-wrap items-center gap-2">
					<WorkflowImportButton />
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
							{getErrorMessage(error, "Please try again in a moment.")}
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
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
						{summary.map(({ label, value, icon, bounce }) => (
							<Card key={label}>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardDescription className="flex w-full justify-between">
										{label}
										<HugeiconsIcon icon={icon} strokeWidth={2} />
									</CardDescription>
								</CardHeader>
								<CardContent>
									<AnimatedNumber
										className="text-3xl font-bold"
										value={value}
										springOptions={{ bounce, duration: 1000 }}
									/>
								</CardContent>
							</Card>
						))}
					</div>
					<section
						aria-labelledby="workflow-list-heading"
						className="space-y-3"
					>
						<h2 id="workflow-list-heading" className="text-base font-medium">
							Your workflows
						</h2>
						<div className="rounded-md border">
							<Table className="min-w-120">
								<TableHeader>
									<TableRow>
										<TableHead>Workflow</TableHead>
										<TableHead className="text-center">Status</TableHead>
										<TableHead className="text-right">Total runs</TableHead>
										<TableHead>Last run</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{workflows.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="py-10 text-center text-muted-foreground"
											>
												No workflows yet. Use New Workflow to create your first
												automation.
											</TableCell>
										</TableRow>
									) : (
										workflows.map((workflow) => (
											<TableRow key={workflow.id}>
												<TableCell>
													<Link
														to="/workflow/$workflowId"
														params={{ workflowId: workflow.id }}
														title={workflow.name}
														className="block max-w-75 truncate font-medium hover:underline underline-offset-4"
													>
														{workflow.name}
													</Link>
												</TableCell>
												<TableCell className="text-center">
													<Badge
														variant={
															workflow.status === "active"
																? "default"
																: "secondary"
														}
													>
														{workflow.status}
													</Badge>
												</TableCell>
												<TableCell className="text-right tabular-nums">
													{workflow.executionCount}
												</TableCell>
												<TableCell className="whitespace-nowrap text-muted-foreground">
													{formatDate(workflow.lastExecutedAt)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</section>
				</>
			) : null}
		</div>
	);
};
