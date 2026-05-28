import { Edit02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMatch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	useUpdateUserWorkflow,
	useUserWorkflowQuery,
} from "@/queries/userWorkflows";

export const WorkflowNameSection = memo(() => {
	const match = useMatch({
		from: "/_mainLayout/workflow/$workflowId",
		shouldThrow: false,
	});
	const { data: userWorkflows } = useUserWorkflowQuery();
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const updateUserWorkflow = useUpdateUserWorkflow();

	const workflowId = match?.params?.workflowId;
	const workflowName = userWorkflows?.find((w) => w.id === workflowId)?.name;

	const handleStartEditing = useCallback(() => {
		setName(workflowName ?? "");
		setIsEditing(true);
	}, [workflowName]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			const len = inputRef.current.value.length;
			inputRef.current.setSelectionRange(len, len);
		}
	}, [isEditing]);

	const handleSave = useCallback(() => {
		if (!name.trim() || name === workflowName) {
			setIsEditing(false);
			return;
		}
		if (!workflowId) return;
		updateUserWorkflow.mutate(
			{ workflowId, data: { name: name.trim() } },
			{ onSuccess: () => setIsEditing(false) },
		);
	}, [name, workflowName, workflowId, updateUserWorkflow]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") handleSave();
			if (e.key === "Escape") setIsEditing(false);
		},
		[handleSave],
	);

	if (!match) return null;

	if (!workflowName) {
		return (
			<div className="bg-accent py-1 px-2.5 rounded-md h-7 w-56 animate-pulse" />
		);
	}

	return (
		<div className="flex items-center gap-1.5">
			<div className="relative max-w-[100ch]">
				{isEditing ? (
					<>
						<input
							ref={inputRef}
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={handleKeyDown}
							className="h-7 py-1 px-2.5 text-sm tracking-wide rounded-md border-0 bg-accent outline-none field-sizing-content min-w-32"
						/>
						<motion.div
							initial={{ scaleX: 0 }}
							animate={{ scaleX: 1 }}
							transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
							className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left rounded-full"
						/>
					</>
				) : (
					<div className="bg-accent py-1 px-2.5 rounded-md  text-sm tracking-wide truncate">
						{workflowName}
					</div>
				)}
			</div>

			<Button
				variant="ghost"
				size="icon-sm"
				className="text-muted-foreground"
				onClick={isEditing ? handleSave : handleStartEditing}
				disabled={updateUserWorkflow.isPending}
			>
				<AnimatePresence mode="popLayout">
					{isEditing ? (
						<motion.span
							key="check"
							initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
							animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
							exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							className="flex"
						>
							<HugeiconsIcon icon={Tick02Icon} />
						</motion.span>
					) : (
						<motion.span
							key="edit"
							initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
							animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
							exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							className="flex"
						>
							<HugeiconsIcon icon={Edit02Icon} />
						</motion.span>
					)}
				</AnimatePresence>
			</Button>
		</div>
	);
});
