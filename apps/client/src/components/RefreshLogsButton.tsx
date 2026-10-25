import { ReloadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export const RefreshLogsButton = ({
	onRefresh,
	isFetching,
}: {
	onRefresh: () => Promise<unknown>;
	isFetching: boolean;
}) => {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [announcement, setAnnouncement] = useState("");
	const refreshingRef = useRef(false);
	const label = isRefreshing ? "Refreshing logs" : "Refresh logs";

	const refresh = async () => {
		if (isFetching || refreshingRef.current) return;
		refreshingRef.current = true;
		setIsRefreshing(true);
		setAnnouncement("Refreshing logs.");
		try {
			await onRefresh();
			setAnnouncement("Logs refreshed.");
		} catch {
			const message = "Could not refresh logs. Try again.";
			setAnnouncement(message);
			toast.error(message);
		} finally {
			refreshingRef.current = false;
			setIsRefreshing(false);
		}
	};

	return (
		<>
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="inline-flex shrink-0">
							<Button
								type="button"
								variant="outline"
								size="icon-sm"
								className="text-muted-foreground hover:text-foreground pointer-coarse:size-11"
								aria-label={label}
								aria-busy={isRefreshing}
								disabled={isFetching || isRefreshing}
								onClick={refresh}
							>
								<HugeiconsIcon
									icon={ReloadIcon}
									size={16}
									aria-hidden="true"
									className={
										isRefreshing ? "motion-safe:animate-spin" : undefined
									}
								/>
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent side="bottom" sideOffset={6}>
						{label}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<output className="sr-only" aria-live="polite">
				{announcement}
			</output>
		</>
	);
};
