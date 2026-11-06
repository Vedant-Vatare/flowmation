import { Zap } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	getNodeOutputPorts,
	type NodeExecutionUpdate,
	switchNodeValueSchemas,
} from "@nodebase/shared";
import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useUpdateNodeInternals,
} from "@xyflow/react";
import { AlertCircle } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import type { WorkflowNodeData } from "@/constants/nodes";
import { useTestWorkflowExecution } from "@/hooks/useWorkflow";
import { cn } from "@/lib/utils";
import {
	useWorkflowExecutionStore,
	useWorkflowStore,
	useWorkflowTriggerStore,
} from "@/store/workflow/useWorkflowStore";

type ExecutionStateType = NodeExecutionUpdate["type"] | null;

const NODE_VARS = {
	"--node-w": "calc(var(--node-box-width) + 52px)",
	"--node-h": "calc(var(--node-box-height) + 28px)",
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
	({ data, selected }: NodeProps<Node<WorkflowNodeData>>) => {
		const { ui, name, inputPorts, outputPorts: savedOutputPorts } = data;
		const draftCases = useWorkflowStore((state) =>
			data.task === "action.switch"
				? state.nodeDrafts[data.id]?.cases
				: undefined,
		);
		const outputPorts = useMemo(() => {
			const cases = switchNodeValueSchemas.cases.safeParse(draftCases);
			return cases.success
				? getNodeOutputPorts({
						task: data.task,
						settings: data.settings,
						parameters: [{ name: "cases", value: cases.data }],
					})
				: savedOutputPorts;
		}, [data.task, data.settings, draftCases, savedOutputPorts]);
		const portCount = Math.max(
			1,
			inputPorts?.length ?? 0,
			outputPorts?.length ?? 0,
		);
		const boxHeight = `max(var(--icon-size), calc(24px + ${portCount - 1} * var(--handle-gap)))`;
		const boxWidth =
			"min(80px, calc(var(--icon-size) + (var(--node-box-height) - var(--icon-size)) / 4))";
		const configurationIssues = useWorkflowStore(
			(state) => state.nodeConfigurationIssues[data.id],
		);
		const updateNodeInternals = useUpdateNodeInternals();
		// biome-ignore lint/correctness/useExhaustiveDependencies: React Flow must remeasure when either set of handles changes.
		useEffect(() => {
			updateNodeInternals(data.id);
		}, [data.id, inputPorts, outputPorts, updateNodeInternals]);
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
			const offset = i - (total - 1) / 2;
			return `calc(var(--node-box-height) / 2 + ${offset} * var(--handle-gap))`;
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
				style={
					{
						...(isTrigger ? TRIGGER_VARS : NODE_VARS),
						"--node-box-height": boxHeight,
						"--node-box-width": boxWidth,
					} as React.CSSProperties & Record<`--${string}`, string>
				}
				data-type={data.type}
				className={cn(
					"workflow-node group relative cursor-grab transition-all duration-150",
					selected && "selected",
					getStateClass(),
				)}
			>
				{isTrigger && isSelectingTrigger && ui.triggerTestMode ? (
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
						title={port.label || port.name}
						aria-label={port.label || port.name}
						style={{
							...baseHandleStyles,
							left: "calc((var(--node-w) - var(--node-box-width)) / 2 - var(--handle-size) / 2)",
							top: getHandleTop(i, inputPorts.length),
						}}
					/>
				))}

				<div
					style={{
						width: "var(--node-box-width)",
						height: "var(--node-box-height)",
						borderRadius: "var(--icon-radius)",
						background: nodeColor,
					}}
					className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200 group-hover:scale-105!"
				>
					<Icon
						style={ui.branded ? {} : { color: ui.color ?? "#ffffff" }}
						className="w-5.5 h-5.5 transition-transform duration-200 group-hover:scale-110"
					/>
					{!!configurationIssues?.length && (
						<span
							role="img"
							title={configurationIssues.join("\n")}
							aria-label={`${name}: ${configurationIssues.length} configuration ${configurationIssues.length === 1 ? "issue" : "issues"}. Open the node to fix them.`}
							className="absolute -right-1.5 -top-1.5 rounded-full border border-border bg-background p-0.5 text-destructive"
						>
							<AlertCircle className="size-3.5" />
						</span>
					)}
				</div>

				<span
					style={{
						color: "var(--foreground)",
						top: "calc(var(--node-box-height) + 4px)",
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
						title={port.label || port.name}
						aria-label={port.label || port.name}
						isConnectable={
							savedOutputPorts?.some((saved) => saved.name === port.name) ??
							false
						}
						style={{
							...baseHandleStyles,
							right:
								"calc((var(--node-w) - var(--node-box-width)) / 2 - var(--handle-size) / 2)",
							top: getHandleTop(i, outputPorts.length),
							cursor: "crosshair",
						}}
					/>
				))}
			</div>
		);
	},
);
