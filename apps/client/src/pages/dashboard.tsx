import {
	ActivityIcon,
	Alert02Icon,
	WorkflowCircle01Icon,
	ZapIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UserWorkflow } from "@nodebase/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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

const statusVariant: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	active: "default",
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

export const Dashboard = () => {
	const { data: userWorkflows } = useUserWorkflowQuery();
	const { mutateAsync: createWorkflow } = useCreateUserWorkflowQuery();
	const navigate = useNavigate();
	if (!userWorkflows) {
		return null;
	}

	const handleCreateWorkflow = async () => {
		const workflowName = getPlaceholderWorkflowName(userWorkflows);
		const newWorkflow = await createWorkflow(workflowName);

		navigate({
			to: "/workflow/$workflowId",
			params: { workflowId: newWorkflow.id },
		});
	};

	const activeWorkflows = userWorkflows.filter(
		(w) => w.status === "active",
	).length;

	const totalRuns = userWorkflows.reduce((acc, w) => acc + w.executionCount, 0);
	const failedWorkflows = userWorkflows.filter(
		(w) => w.status === "failed",
	).length;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
				<Button onClick={handleCreateWorkflow}>
					<Plus className="size-4" />
					New Workflow
				</Button>
			</div>
			<Separator />
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
							value={userWorkflows.length}
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
								<TableHead className="hidden md:table-cell">Last Run</TableHead>
								<TableHead className="hidden md:table-cell">Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{userWorkflows.map((workflow) => (
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
		</div>
	);
};
