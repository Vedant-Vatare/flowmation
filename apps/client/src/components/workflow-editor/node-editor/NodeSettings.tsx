import { ChevronRight } from "lucide-react";
import { memo, useCallback, useState } from "react";
import {
	type Control,
	Controller,
	type UseFormRegister,
} from "react-hook-form";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import type { WorkflowNodeData } from "@/constants/nodes";

let settingsOpen = true;

type SettingField = {
	label: string;
	type: "number" | "boolean" | "textarea";
	min?: number;
	max?: number;
};

const DEFAULT_SETTINGS: Record<string, SettingField> = {
	retryCount: { label: "Retry Count", type: "number", min: 0, max: 3 },
	timeout: { label: "Timeout (s)", type: "number", min: 0 },
	continueOnFail: { label: "Continue on Fail", type: "boolean" },
	alwaysOutputData: { label: "Always Output Data", type: "boolean" },
	fallbackOutputData: { label: "Fallback Output", type: "textarea" },
	disabled: { label: "Disabled", type: "boolean" },
};

const NODE_SPECIFIC_SETTINGS: Record<string, Record<string, SettingField>> = {
	"action.http": {
		timeout: { label: "Request Timeout (s)", type: "number", min: 1, max: 300 },
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
	}: {
		name: string;
		label: string;
		min?: number;
		max?: number;
		register: UseFormRegister<Record<string, unknown>>;
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
				type="number"
				min={min}
				max={max}
				className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-auto"
				{...register(name, { valueAsNumber: true })}
			/>
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

	const toggle = useCallback(() => {
		settingsOpen = !settingsOpen;
		setOpen(settingsOpen);
	}, []);

	const settings = nodeData.settings;
	if (!settings) return null;

	const keys = ORDER.filter(
		(k) =>
			k in settings &&
			settings[k as keyof typeof settings] !== undefined &&
			settings[k as keyof typeof settings] !== null,
	);

	if (keys.length === 0) return null;

	return (
		<Collapsible
			open={open}
			onOpenChange={toggle}
			className="group/collapsible"
		>
			<CollapsibleTrigger asChild>
				<button
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
				{keys.map((key) => {
					const field = getField(key, nodeData.task);
					if (!field) return null;

					switch (field.type) {
						case "number":
							return (
								<NumberSetting
									key={key}
									name={key}
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
