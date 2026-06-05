import { Zap } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { NodeExecutionUpdate } from "@nodebase/shared";
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo, useEffect, useState } from "react";
import type { WorkflowNodeData } from "@/constants/nodes";
import { useTestWorkflowExecution } from "@/hooks/useWorkflow";
import { cn } from "@/lib/utils";
import {
	useWorkflowExecutionStore,
	useWorkflowTriggerStore,
} from "@/store/workflow/useWorkflowStore";

type ExecutionStateType = NodeExecutionUpdate["type"] | null;

const NODE_VARS = {
	"--node-w": "100px",
	"--node-h": "76px",
	"--icon-size": "48px",
	"--icon-radius": "0.8rem",
	"--handle-size": "8px",
	"--handle-gap": "20px",
} as const;

const TRIGGER_VARS = {
	...NODE_VARS,
	"--icon-radius": "45% 20% 20% 45%",
} as const;

export const WorkflowNode = memo(
	({ data }: NodeProps<Node<WorkflowNodeData>>) => {
		const { ui, name, inputPorts, outputPorts } = data;
		const Icon = ui.icon;
		const nodeColor = ui.background ?? "#6366f1";

		const [executionState, setExecutionState] =
			useState<ExecutionStateType>(null);

		const showExecutionUpdates = useWorkflowExecutionStore(
			(s) => s.showExecutionUpdates,
		);
		const currentNodeUpdate = useWorkflowExecutionStore(
			(s) => s.nodeExecutionUpdates[data.id],
		);

		const isSelectingTrigger = useWorkflowTriggerStore(
			(s) => s.isSelectingTrigger,
		);
		const setIsSelectingTrigger = useWorkflowTriggerStore(
			(s) => s.setIsSelectingTrigger,
		);

		const { executeTriggerNode, isPending } = useTestWorkflowExecution();
		const isTrigger = data.type === "trigger";

		const baseHandleStyles = {
			width: "var(--handle-size)",
			height: "var(--handle-size)",
			minWidth: "var(--handle-size)",
			minHeight: "var(--handle-size)",
			background: "oklch(0.95 0 0)",
			border: "2px solid var(--border)",
			borderRadius: "50%",
			opacity: 1,
			zIndex: 20,
			transition: "all 0.15s ease",
			transform: "translateY(-50%)",
		};

		const getHandleTop = (i: number, total: number) => {
			if (total === 1) return "calc(var(--icon-size) / 2)";
			const offset = i - (total - 1) / 2;
			return `calc(var(--icon-size) / 2 + ${offset} * var(--handle-gap))`;
		};

		useEffect(() => {
			if (!showExecutionUpdates) {
				setExecutionState(null);
				return;
			}
			if (!currentNodeUpdate) return;
			setExecutionState(currentNodeUpdate.type);
		}, [showExecutionUpdates, currentNodeUpdate]);

		const getStateClass = () => {
			switch (executionState) {
				case "node:started":
					return "executing";
				case "node:completed":
					return "completed";
				case "node:failed":
					return "failed";
				default:
					return "";
			}
		};

		return (
			<div
				style={(isTrigger ? TRIGGER_VARS : NODE_VARS) as React.CSSProperties}
				data-type={data.type}
				className={cn(
					"workflow-node group relative cursor-grab transition-all duration-150",
					getStateClass(),
				)}
			>
				{isTrigger && isSelectingTrigger ? (
					<button
						type="button"
						disabled={isPending}
						onClick={(e) => {
							e.stopPropagation();
							executeTriggerNode(data);
							setIsSelectingTrigger(false);
						}}
						className="absolute flex text-center w-max -left-full top-1/2 -translate-y-1/2 size-8 rounded-full border border-border bg-[#f2f2f2] text-[#222] items-center justify-center shadow-sm hover:text-accent-foreground transition-colors p-2 gap-1.5 hover:cursor-pointer"
						title="Execute from this trigger"
					>
						<HugeiconsIcon icon={Zap} className="text-xs" size={20} />
						<span className="text-xs">Execute</span>
					</button>
				) : null}

				{inputPorts?.map((port, i) => (
					<Handle
						key={port.name}
						id={port.name}
						type="target"
						position={Position.Left}
						style={{
							...baseHandleStyles,
							left: "calc((var(--node-w) - var(--icon-size)) / 2 - var(--handle-size) / 2)",
							top: getHandleTop(i, inputPorts.length),
						}}
					/>
				))}

				<div
					style={{
						width: "var(--icon-size)",
						height: "var(--icon-size)",
						borderRadius: "var(--icon-radius)",
						background: nodeColor,
					}}
					className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200 group-hover:scale-105!"
				>
					<Icon
						style={ui.branded ? {} : { color: ui.color ?? "#ffffff" }}
						className="w-5.5 h-5.5 transition-transform duration-200 group-hover:scale-110"
					/>
				</div>

				<span
					style={{
						color: "var(--foreground)",
						top: "calc(var(--icon-size) + 4px)",
						left: "50%",
						transform: "translateX(-50%)",
						textWrap: "balance",
					}}
					className="absolute w-full text-[11px] font-medium text-center leading-tight line-clamp-2 px-1"
					title={name}
				>
					{name}
				</span>

				{outputPorts?.map((port, i) => (
					<Handle
						key={port.name}
						id={port.name}
						type="source"
						position={Position.Right}
						style={{
							...baseHandleStyles,
							right:
								"calc((var(--node-w) - var(--icon-size)) / 2 - var(--handle-size) / 2)",
							top: getHandleTop(i, outputPorts.length),
							cursor: "crosshair",
						}}
					/>
				))}

				{outputPorts?.length > 1 &&
					outputPorts.map((port, i) => (
						<div
							key={port.name}
							style={{
								top: getHandleTop(i, outputPorts.length),
								left: "calc(100% + 6px)",
								transform: "translateY(-50%)",
							}}
							className="absolute text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
						>
							{port.label}
						</div>
					))}
			</div>
		);
	},
);
