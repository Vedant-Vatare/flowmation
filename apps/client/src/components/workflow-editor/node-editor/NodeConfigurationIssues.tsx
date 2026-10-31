import { AlertCircle, ArrowDown, ChevronDown } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type ConfigurationIssue = {
	field: string;
	label: string;
	message: string;
};

export function NodeConfigurationIssues({
	issues,
	onSelect,
}: {
	issues: ConfigurationIssue[];
	onSelect: (field: string) => void;
}) {
	if (!issues.length) return null;
	const singleIssue = issues.length === 1 ? issues[0] : undefined;
	const icon = (
		<AlertCircle
			aria-hidden="true"
			className="mt-0.5 size-3.5 shrink-0 text-destructive/80"
		/>
	);
	const triggerClass =
		"flex w-full items-start gap-2 rounded px-2 py-2 text-left text-xs hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

	return (
		<section
			aria-label="Node configuration issues"
			className="mx-3 mb-3 border-b border-border/50 pb-3"
		>
			{singleIssue ? (
				<button
					type="button"
					aria-label={singleIssue.message}
					onClick={() => onSelect(singleIssue.field)}
					className={triggerClass}
				>
					{icon}
					<output className="min-w-0 flex-1 wrap-break-word leading-relaxed">
						{singleIssue.message}
					</output>
					<ArrowDown
						aria-hidden="true"
						className="mt-0.5 size-3 shrink-0 text-muted-foreground"
					/>
				</button>
			) : (
				<Collapsible className="group/issues">
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className={triggerClass}
							aria-label={`${issues.length} fields need to be fixed`}
						>
							{icon}
							<output className="flex-1 leading-relaxed">
								{`${issues.length} fields need to be fixed`}
							</output>
							<ChevronDown
								aria-hidden="true"
								className="mt-0.5 size-3.5 shrink-0 text-muted-foreground group-data-[state=open]/issues:rotate-180"
							/>
						</button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<ul className="mt-1 max-h-40 overflow-y-auto space-y-1">
							{issues.map((issue) => (
								<li key={issue.field}>
									<button
										type="button"
										onClick={() => onSelect(issue.field)}
										className={triggerClass}
									>
										<span className="min-w-0 flex-1 wrap-break-word">
											<span className="font-medium text-foreground">
												{issue.label}
											</span>
											<span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
												{issue.message}
											</span>
										</span>
										<ArrowDown
											aria-hidden="true"
											className="mt-0.5 size-3 shrink-0 text-muted-foreground"
										/>
									</button>
								</li>
							))}
						</ul>
					</CollapsibleContent>
				</Collapsible>
			)}
			<p className="mt-1 px-2 text-[11px] leading-relaxed text-muted-foreground">
				Parameter changes stay in this draft until these are fixed.
			</p>
		</section>
	);
}
