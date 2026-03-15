import { Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { WorkflowNodeData } from "@/constants/nodes";
import { withAlpha } from "@/utils/colors";

export const WorkflowNode = memo(
	({ data, selected }: NodeProps<Node<WorkflowNodeData>>) => {
		const { ui, name, inputPorts, outputPorts } = data;
		const Icon = ui.icon;
		const bg = withAlpha(ui.background ?? "#6366f1", 0.2);
		const border = ui.background ?? "#6366f1";

		return (
			<div
				style={{
					background: bg,
					borderColor: selected ? "#ffffff" : withAlpha(border, 0.4),
				}}
				className="group relative min-w-32 h-28 max-w-max rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border-2 hover:scale-105 cursor-grab"
			>
				{inputPorts?.map((port, i) => (
					<Handle
						key={port.name}
						id={port.name}
						type="target"
						position={Position.Left}
						style={{
							top: `${((i + 1) / (inputPorts.length + 1)) * 100}%`,
							height: 7,
							width: 7,
							background: "var(--background)",
							border: `2px solid ${withAlpha(border, 0.8)}`,
							borderRadius: "50%",
							transition: "transform 0.15s",
						}}
						className="hover:scale-105"
					/>
				))}

				<div
					style={{
						background: withAlpha(border, 0.15),
						border: `1px solid ${withAlpha(border, 0.3)}`,
					}}
					className="w-10 h-10 rounded-lg flex items-center justify-center"
				>
					<Icon
						style={{ color: ui.color ?? "#ffffff" }}
						className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
					/>
				</div>

				<span
					style={{ color: "var(--foreground)" }}
					className="text-xs font-bold text-center leading-tight px-1"
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
							top: `${((i + 1) / (outputPorts.length + 1)) * 100}%`,
							height: 7,
							width: 7,
							borderColor: border,
							borderRadius: "50%",
							cursor: "crosshair",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 10,
							transition: "transform 0.15s, box-shadow 0.15s",
							boxShadow: `0 0 6px ${withAlpha(border, 0.5)}`,
						}}
						className="hidden group-hover:block"
					>
						<span className="text-accent text-xs pointer-events-none h-16 w-16 p-1 object-cover select-none font-bold">
							<HugeiconsIcon icon={Plus} className="h-full w-full" />
						</span>
					</Handle>
				))}

				{outputPorts?.length > 1 &&
					outputPorts.map((port, i) => (
						<div
							key={port.name}
							style={{
								top: `${((i + 1) / (outputPorts.length + 1)) * 100}%`,
								right: "-50%",
								transform: "translateY(-50%)",
								background: withAlpha(border, 0.15),
								border: `1px solid ${withAlpha(border, 0.3)}`,
								color: border,
							}}
							className="absolute text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
						>
							{port.label}
						</div>
					))}
			</div>
		);
	},
);
