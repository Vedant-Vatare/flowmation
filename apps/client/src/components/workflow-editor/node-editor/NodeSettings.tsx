import {
	getNodeErrorSetting,
	getNodeOutputPorts,
	type NodeSettings as NodeSettingsValue,
	supportsErrorOutput,
} from "@nodebase/shared";
import { useReactFlow, useStore as useReactFlowStore } from "@xyflow/react";
import { ChevronRight } from "lucide-react";
import { memo, useCallback, useState } from "react";
import {
	type Control,
	Controller,
	type UseFormRegister,
	useFormState,
} from "react-hook-form";
import { toast } from "sonner";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { WorkflowCanvasNode, WorkflowNodeData } from "@/constants/nodes";
import { useUpdateWorkflowNode } from "@/queries/userWorkflows";
import { getEditableNodeSettings } from "./nodeSettings.utils";

let settingsOpen = true;

type SettingField = {
	label: string;
	type: "number" | "boolean" | "textarea";
	min?: number;
	max?: number;
};

const DEFAULT_SETTINGS: Record<string, SettingField> = {
	retryCount: {
		label: "Additional Retry Attempts",
		type: "number",
		min: 0,
		max: 3,
	},
	timeout: {
		label: "Execution Timeout (ms, 0 = unlimited)",
		type: "number",
		min: 0,
		max: 30000,
	},
	continueOnFail: { label: "Continue on Fail", type: "boolean" },
	alwaysOutputData: { label: "Always Output Data", type: "boolean" },
	fallbackOutputData: { label: "Fallback Output", type: "textarea" },
	disabled: { label: "Disabled", type: "boolean" },
};

const NODE_SPECIFIC_SETTINGS: Record<string, Record<string, SettingField>> = {
	"action.http": {
		timeout: {
			label: "Execution Timeout (ms, 0 = unlimited)",
			type: "number",
			min: 0,
			max: 30000,
		},
	},
};

function getField(key: string, task: string): SettingField | undefined {
	return NODE_SPECIFIC_SETTINGS[task]?.[key] ?? DEFAULT_SETTINGS[key];
}

const ORDER = [
	"retryCount",
	"timeout",
	"continueOnFail",
	"alwaysOutputData",
	"fallbackOutputData",
	"disabled",
];

const NumberSetting = memo(
	({
		name,
		label,
		min,
		max,
		register,
		error,
	}: {
		name: string;
		label: string;
		min?: number;
		max?: number;
		register: UseFormRegister<Record<string, unknown>>;
		error?: string;
	}) => (
		<div className="flex flex-col gap-2 px-3 py-3 ">
			<label
				htmlFor={name}
				className="text-[10px] font-medium tracking-widest text-muted-foreground/70 leading-none select-none"
			>
				{label}
			</label>
			<input
				id={name}
				aria-invalid={!!error}
				aria-describedby={error ? `${name}-error` : undefined}
				type="number"
				min={min}
				max={max}
				className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-auto"
				{...register(name, { valueAsNumber: true })}
			/>
			{error && (
				<p
					id={`${name}-error`}
					className="text-[11px] text-destructive"
					role="alert"
				>
					{error}
				</p>
			)}
		</div>
	),
);

const BooleanSetting = memo(
	({
		name,
		label,
		control,
	}: {
		name: string;
		label: string;
		control: Control<Record<string, unknown>>;
	}) => (
		<div className="flex items-center justify-between gap-2 px-3 py-3">
			<span className="text-[10px] font-medium tracking-widest text-muted-foreground/70 leading-none select-none">
				{label}
			</span>
			<Controller
				name={name}
				control={control}
				render={({ field }) => (
					<Switch
						aria-label={label}
						checked={!!field.value}
						onCheckedChange={field.onChange}
					/>
				)}
			/>
		</div>
	),
);

const TextareaSetting = memo(
	({
		name,
		label,
		register,
	}: {
		name: string;
		label: string;
		register: UseFormRegister<Record<string, unknown>>;
	}) => (
		<div className="flex flex-col gap-2 px-3 py-3">
			<label
				htmlFor={name}
				className="text-[10px] font-medium tracking-widest text-muted-foreground/70 leading-none select-none"
			>
				{label}
			</label>
			<textarea
				id={name}
				rows={3}
				className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-auto resize-y"
				{...register(name)}
			/>
		</div>
	),
);

type Props = {
	nodeData: WorkflowNodeData;
	register: UseFormRegister<Record<string, unknown>>;
	control: Control<Record<string, unknown>>;
};

export const NodeSettings = memo(({ nodeData, register, control }: Props) => {
	const [open, setOpen] = useState(settingsOpen);
	const { errors } = useFormState({ control });
	const [pendingSetting, setPendingSetting] = useState<string | null>(null);
	const { getNodes, setNodes } = useReactFlow<WorkflowCanvasNode>();
	const { mutateAsync: updateNode } = useUpdateWorkflowNode(nodeData.id);
	const hasErrorConnection = useReactFlowStore((state) =>
		state.edges.some(
			(edge) => edge.source === nodeData.id && edge.sourceHandle === "error",
		),
	);
	const changeErrorSetting = async (
		value: string,
		onChange: (value: string) => void,
	) => {
		if (pendingSetting !== null) return;
		if (hasErrorConnection && value !== "continueErrorOutput") {
			toast.error("Remove the Error connection before changing On Error");
			return;
		}
		const previous = getNodes().find((node) => node.id === nodeData.id)?.data
			.outputPorts;
		const settings = {
			...nodeData.settings,
			onError: value as NodeSettingsValue["onError"],
		};
		const outputPorts = getNodeOutputPorts({ ...nodeData, settings });
		setPendingSetting(value);
		setNodes((nodes) =>
			nodes.map((node) =>
				node.id === nodeData.id
					? { ...node, data: { ...node.data, outputPorts } }
					: node,
			),
		);
		try {
			await updateNode({
				errorSettingChange: true,
				workflowId: nodeData.workflowId,
				node: { id: nodeData.id, task: nodeData.task, settings },
			});
			onChange(value);
		} catch {
			setNodes((nodes) =>
				nodes.map((node) =>
					node.id === nodeData.id
						? {
								...node,
								data: {
									...node.data,
									outputPorts: previous ?? nodeData.outputPorts,
								},
							}
						: node,
				),
			);
			toast.error(
				"Could not save On Error. Your previous setting has been restored.",
			);
		} finally {
			setPendingSetting(null);
		}
	};

	const toggle = useCallback(() => {
		settingsOpen = !settingsOpen;
		setOpen(settingsOpen);
	}, []);

	const settings = getEditableNodeSettings(nodeData.task, nodeData.settings);
	if (!settings) return null;

	const keys = ORDER.filter(
		(k) =>
			!(k === "continueOnFail" && supportsErrorOutput(nodeData.task)) &&
			k in settings &&
			settings[k as keyof typeof settings] !== undefined &&
			settings[k as keyof typeof settings] !== null,
	);

	if (keys.length === 0 && !supportsErrorOutput(nodeData.task)) return null;

	return (
		<Collapsible
			open={open}
			onOpenChange={toggle}
			className="group/collapsible"
		>
			<CollapsibleTrigger asChild>
				<button
					id="node-settings-toggle"
					type="button"
					className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-muted/30 transition-colors"
				>
					<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 leading-none">
						Node Settings
					</span>
					<ChevronRight className="size-3 text-muted-foreground/50 ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				{supportsErrorOutput(nodeData.task) && (
					<Controller
						name="onError"
						control={control}
						defaultValue={getNodeErrorSetting(nodeData.task, settings)}
						render={({ field }) => (
							<div className="flex flex-col gap-2 px-3 py-3">
								<label
									htmlFor="onError"
									className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70"
								>
									On Error
								</label>
								<Select
									name={field.name}
									value={pendingSetting ?? String(field.value)}
									disabled={pendingSetting !== null}
									onValueChange={(value) =>
										void changeErrorSetting(value, field.onChange)
									}
								>
									<SelectTrigger
										id="onError"
										ref={field.ref}
										onBlur={field.onBlur}
										className="w-full bg-muted/50"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent position="popper">
										<SelectItem
											value="stopWorkflow"
											disabled={hasErrorConnection}
										>
											Stop Workflow
										</SelectItem>
										<SelectItem
											value="continueRegularOutput"
											disabled={hasErrorConnection}
										>
											Continue
										</SelectItem>
										<SelectItem value="continueErrorOutput">
											Continue (using error output)
										</SelectItem>
									</SelectContent>
								</Select>
								{hasErrorConnection && (
									<p className="text-xs text-muted-foreground">
										Remove the connection from the Error port before choosing
										Stop Workflow or Continue.
									</p>
								)}
								<p className="text-xs text-muted-foreground">
									Applies after retries finish. Error output adds a separate
									port for a recovery path.
								</p>
							</div>
						)}
					/>
				)}
				{keys.map((key) => {
					const field = getField(key, nodeData.task);
					if (!field) return null;

					switch (field.type) {
						case "number":
							return (
								<NumberSetting
									key={key}
									name={key}
									error={
										typeof errors[key]?.message === "string"
											? errors[key]?.message
											: undefined
									}
									label={field.label}
									min={field.min}
									max={field.max}
									register={register}
								/>
							);
						case "boolean":
							return (
								<BooleanSetting
									key={key}
									name={key}
									label={field.label}
									control={control}
								/>
							);
						case "textarea":
							return (
								<TextareaSetting
									key={key}
									name={key}
									label={field.label}
									register={register}
								/>
							);
						default:
							return null;
					}
				})}
			</CollapsibleContent>
		</Collapsible>
	);
});
