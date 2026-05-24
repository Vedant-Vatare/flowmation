import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";

export type EditorStatus = "idle" | "unsaved" | "saving" | "saved" | "missing";

export const EditorStatusBar = ({ status }: { status: EditorStatus }) => (
	<div className="pl-2.5 pr-2 h-6.5 overflow-hidden">
		<AnimatePresence mode="wait" initial={false}>
			{status !== "idle" && (
				<motion.div
					key={status}
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
					className="flex text-xs items-center gap-1.5"
					aria-live="polite"
				>
					{status === "unsaved" && (
						<span className="text-muted-foreground/70 flex items-center gap-1.5">
							<span className="h-1.5 w-1.5 rounded-full bg-amber-300/70" />
							Unsaved changes
						</span>
					)}
					{status === "saving" && (
						<span className="text-muted-foreground/70 flex items-center gap-1.5">
							<HugeiconsIcon icon={Loading03Icon} size={12} className="animate-spin" />
							Saving…
						</span>
					)}
					{status === "saved" && (
						<span className="text-foreground/75">
							Saved
						</span>
					)}
					{status === "missing" && (
						<span className="text-destructive truncate flex items-center gap-1.5">
							Required fields missing
						</span>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	</div>
);
