import { CopyCheck, CopyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useWebhookStore } from "@/store/workflow/useWorkflowStore";
import { Button } from "../ui/button";

export const TestWebhook = () => {
	const testWebhook = useWebhookStore((s) => s.testWebhook);
	const setTestWebhook = useWebhookStore((s) => s.setTestWebhook);
	const [timeRemain, setTimeRemain] = useState(1000 * 60 * 2);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!testWebhook.isActive) return;

		setTimeRemain(1000 * 60 * 2);

		const interval = setInterval(() => {
			setTimeRemain((prev) => {
				if (prev <= 1000) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1000;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [testWebhook.isActive]);

	useEffect(() => {
		if (timeRemain === 0 && testWebhook.isActive) {
			setTestWebhook({ isActive: false, webhookId: null });
		}
	}, [timeRemain, testWebhook.isActive, setTestWebhook]);

	const handleCopy = () => {
		const url = `${import.meta.env.VITE_API_URL}/webhooks/test/${testWebhook.webhookId}`;
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const totalSeconds = Math.floor(timeRemain / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

	return (
		<AnimatePresence>
			{testWebhook.isActive && testWebhook.webhookId && (
				<motion.div
					initial={{ y: -50, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -50, opacity: 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 25 }}
					className="absolute top-2 left-4 z-10 h-max inset-0 mx-auto flex items-center bg-sidebar rounded-full border border-sidebar-border shadow-md p-1 w-max"
				>
					<Button
						size="sm"
						variant="ghost"
						onClick={handleCopy}
						className="rounded-full flex items-center gap-2 hover:bg-sidebar-accent text-sidebar-foreground transition-colors px-4"
					>
						{copied ? (
							<HugeiconsIcon
								icon={CopyCheck}
								size={16}
								className="text-success"
							/>
						) : (
							<HugeiconsIcon icon={CopyIcon} size={16} />
						)}
						<span className="font-medium text-sm">
							{copied ? "Copied!" : "Copy Test URL"}
						</span>
					</Button>

					<div className="flex items-center gap-2 border-l border-sidebar-border pl-3 pr-4 h-5">
						<div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
						<span className="text-xs font-mono text-sidebar-foreground/70 tabular-nums">
							{formattedTime}
						</span>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
