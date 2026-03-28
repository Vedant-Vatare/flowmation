/* biome-ignore-all lint/suspicious/noArrayIndexKey : ignore index */
import type { NodeParameters } from "@nodebase/shared";
import { Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
	type Control,
	Controller,
	type UseFormRegister,
} from "react-hook-form";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { ExpressionInput } from "./ExpressionInput";

export type NodeFieldProps = {
	field: NodeParameters;
	register: UseFormRegister<Record<string, unknown>>;
	control: Control<Record<string, unknown>>;
	currentNodeId: string;
};

export type OptionItem = { label: string; value: unknown };

const inputCls =
	"w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground " +
	"placeholder:text-muted-foreground/50 " +
	"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
	"disabled:cursor-not-allowed disabled:opacity-50";

const FieldWrapper = ({
	field,
	children,
}: {
	field: NodeParameters;
	children: React.ReactNode;
}) => (
	<div className="flex flex-col gap-2 px-3 py-3 border-b border-border/50 last:border-b-0">
		<div className="flex items-center gap-1">
			<label
				htmlFor={field.name}
				className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 leading-none select-none"
			>
				{field.label}
			</label>
			{field.required && (
				<span
					className="text-destructive text-[10px] leading-none"
					title="Required"
				>
					*
				</span>
			)}
		</div>
		{children}

		{field.description && (
			<p className="text-[11px] text-muted-foreground/60 leading-snug">
				{field.description}
			</p>
		)}
	</div>
);

const ExpressionController = ({
	field,
	control,
	currentNodeId,
	multiline = false,
}: Pick<NodeFieldProps, "field" | "control" | "currentNodeId"> & {
	multiline?: boolean;
}) => (
	<Controller
		name={field.name}
		control={control}
		render={({ field: f }) => (
			<ExpressionInput
				id={field.name}
				value={String(f.value ?? "")}
				onChange={f.onChange}
				currentNodeId={currentNodeId}
				multiline={multiline}
				placeholder={String(field.placeholder ?? field.default ?? "")}
				className="bg-muted/50"
			/>
		)}
	/>
);

export const InputField = ({
	field,
	control,
	currentNodeId,
}: Pick<NodeFieldProps, "field" | "control" | "currentNodeId">) => (
	<FieldWrapper field={field}>
		<ExpressionController
			field={field}
			control={control}
			currentNodeId={currentNodeId}
		/>
	</FieldWrapper>
);

export const NumberField = ({
	field,
	control,
	currentNodeId,
}: Pick<NodeFieldProps, "field" | "control" | "currentNodeId">) => (
	<FieldWrapper field={field}>
		<ExpressionController
			field={field}
			control={control}
			currentNodeId={currentNodeId}
		/>
	</FieldWrapper>
);

export const TextareaField = ({
	field,
	control,
	currentNodeId,
}: Pick<NodeFieldProps, "field" | "control" | "currentNodeId">) => (
	<FieldWrapper field={field}>
		<ExpressionController
			field={field}
			control={control}
			currentNodeId={currentNodeId}
			multiline
		/>
	</FieldWrapper>
);

export const BooleanField = ({
	field,
	control,
}: Pick<NodeFieldProps, "field" | "control">) => (
	<FieldWrapper field={field}>
		<Controller
			name={field.name}
			control={control}
			render={({ field: f }) => (
				<label
					htmlFor={field.name}
					className="flex items-center gap-2.5 cursor-pointer w-fit"
				>
					<Checkbox
						id={field.name}
						checked={!!f.value}
						onCheckedChange={f.onChange}
					/>
					<span className="text-sm text-foreground/80">
						{field.placeholder ?? "Enable"}
					</span>
				</label>
			)}
		/>
	</FieldWrapper>
);

export const CheckboxField = ({
	field,
	control,
}: Pick<NodeFieldProps, "field" | "control">) => {
	const options = useMemo(() => {
		if (Array.isArray(field.options))
			return field.options.map((o: OptionItem) => String(o.value));
		return (
			field.default
				?.split(",")
				.map((s) => s.trim())
				.filter(Boolean) ?? []
		);
	}, [field]);

	return (
		<FieldWrapper field={field}>
			<Controller
				name={field.name}
				control={control}
				defaultValue={[]}
				render={({ field: f }) => {
					const selected: string[] = Array.isArray(f.value) ? f.value : [];
					const toggle = (opt: string) =>
						f.onChange(
							selected.includes(opt)
								? selected.filter((v) => v !== opt)
								: [...selected, opt],
						);
					return (
						<div className="flex flex-col gap-2">
							{options.map((opt) => (
								<label
									key={opt}
									htmlFor={`${field.name}-${opt}`}
									className="flex items-center gap-2.5 cursor-pointer w-fit"
								>
									<Checkbox
										id={`${field.name}-${opt}`}
										checked={selected.includes(opt)}
										onCheckedChange={() => toggle(opt)}
									/>
									<span className="text-sm text-foreground/80">{opt}</span>
								</label>
							))}
						</div>
					);
				}}
			/>
		</FieldWrapper>
	);
};

export const RadioField = ({
	field,
	control,
}: Pick<NodeFieldProps, "field" | "control">) => {
	const options = useMemo(() => {
		if (Array.isArray(field.options))
			return field.options.map((o: OptionItem) => String(o.value));
		return (
			field.default
				?.split(",")
				.map((s) => s.trim())
				.filter(Boolean) ?? []
		);
	}, [field]);

	return (
		<FieldWrapper field={field}>
			<Controller
				name={field.name}
				control={control}
				render={({ field: f }) => (
					<RadioGroup
						value={f.value as string}
						onValueChange={f.onChange}
						className="flex flex-col gap-2"
					>
						{options.map((opt) => (
							<label
								key={opt}
								htmlFor={`${field.name}-${opt}`}
								className="flex items-center gap-2.5 cursor-pointer w-fit"
							>
								<RadioGroupItem value={opt} id={`${field.name}-${opt}`} />
								<span className="text-sm text-foreground/80">{opt}</span>
							</label>
						))}
					</RadioGroup>
				)}
			/>
		</FieldWrapper>
	);
};

export const DropdownField = ({
	field,
	control,
}: Pick<NodeFieldProps, "field" | "control">) => {
	const options = (field.options as { label: string; value: string }[]) ?? [];

	return (
		<FieldWrapper field={field}>
			<Controller
				name={field.name}
				control={control}
				render={({ field: f }) => (
					<Select value={(f.value as string) ?? ""} onValueChange={f.onChange}>
						<SelectTrigger
							id={field.name}
							className="bg-muted/50 border-input text-sm"
						>
							<SelectValue
								placeholder={field.placeholder ?? "Select an option"}
							/>
						</SelectTrigger>
						<SelectContent>
							{options.length === 0 ? (
								<div className="px-3 py-2 text-xs text-muted-foreground italic">
									No options available
								</div>
							) : (
								options.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				)}
			/>
		</FieldWrapper>
	);
};

export const DateField = ({
	field,
	register,
}: Pick<NodeFieldProps, "field" | "register">) => (
	<FieldWrapper field={field}>
		<input
			id={field.name}
			type="date"
			className={
				"w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
			}
			{...register(field.name, { required: field.required })}
		/>
	</FieldWrapper>
);

export const DateTimeField = ({
	field,
	register,
}: Pick<NodeFieldProps, "field" | "register">) => (
	<FieldWrapper field={field}>
		<input
			id={field.name}
			type="datetime-local"
			className={inputCls}
			{...register(field.name, { required: field.required })}
		/>
	</FieldWrapper>
);

export const ArrayField = ({
	field,
	control,
	currentNodeId,
}: Pick<NodeFieldProps, "field" | "control" | "currentNodeId">) => (
	<FieldWrapper field={field}>
		<Controller
			name={field.name}
			control={control}
			defaultValue={[]}
			render={({ field: f }) => {
				const items: string[] = Array.isArray(f.value) ? f.value : [""];
				const update = (idx: number, val: string) => {
					const next = [...items];
					next[idx] = val;
					f.onChange(next);
				};
				const remove = (idx: number) =>
					f.onChange(items.filter((_, i) => i !== idx));
				const add = () => f.onChange([...items, ""]);

				return (
					<div className="flex flex-col gap-1.5">
						{items.map((item, idx) => (
							<div key={idx} className="flex items-center gap-1.5">
								<div className="flex-1">
									<ExpressionInput
										value={item}
										onChange={(val) => update(idx, val)}
										currentNodeId={currentNodeId}
										placeholder={field.placeholder ?? `Item ${idx + 1}`}
										className="bg-muted/50"
									/>
								</div>
								<button
									type="button"
									onClick={() => remove(idx)}
									className="h-7 w-7 shrink-0 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>
						))}

						<button
							type="button"
							onClick={add}
							className="flex items-center justify-center gap-1.5 w-full h-7 rounded-md border border-dashed border-border/60 text-xs text-muted-foreground/50 hover:text-foreground hover:border-border transition-colors mt-0.5"
						>
							<Plus className="h-3 w-3" />
							Add item
						</button>
					</div>
				);
			}}
		/>
	</FieldWrapper>
);

type KVPair = { key: string; value: string };

const recordToPairs = (record: Record<string, string>): KVPair[] => {
	const entries = Object.entries(record);
	return entries.length > 0
		? [
				...entries.map(([key, value]) => ({ key, value })),
				{ key: "", value: "" },
			]
		: [{ key: "", value: "" }];
};

const pairsToRecord = (pairs: KVPair[]): Record<string, string> =>
	Object.fromEntries(
		pairs.filter((p) => p.key !== "").map((p) => [p.key, p.value]),
	);

const KeyValueEditor = ({
	value,
	onChange,
	currentNodeId,
}: {
	value: Record<string, string>;
	onChange: (val: Record<string, string>) => void;
	currentNodeId: string;
}) => {
	const [pairs, setPairs] = useState<KVPair[]>(() =>
		value && typeof value === "object" && !Array.isArray(value)
			? recordToPairs(value)
			: [{ key: "", value: "" }],
	);

	const update = (idx: number, part: Partial<KVPair>) => {
		const next = pairs.map((p, i) => (i === idx ? { ...p, ...part } : p));
		const isLast = idx === pairs.length - 1;
		const updated = next[idx];
		if (isLast && (updated?.key !== "" || updated?.value !== "")) {
			next.push({ key: "", value: "" });
		}
		setPairs(next);
		onChange(pairsToRecord(next));
	};

	const remove = (idx: number) => {
		const next = pairs.filter((_, i) => i !== idx);
		setPairs(next);
		onChange(pairsToRecord(next));
	};

	return (
		<div className="flex flex-col gap-1 group/kv">
			<div className="flex items-center pr-7">
				<span className="flex-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2.5">
					key
				</span>
				<div className="w-px shrink-0" />
				<span className="flex-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2.5">
					value
				</span>
			</div>

			{pairs.map((pair, idx) => (
				<div key={idx} className="flex items-center gap-1.5">
					<div className="flex flex-1 min-w-0 items-stretch rounded-md border border-input bg-muted/50 focus-within:ring-1 focus-within:ring-ring overflow-hidden transition-shadow">
						<input
							value={pair.key}
							placeholder="key"
							onChange={(e) => update(idx, { key: e.target.value })}
							className="flex-1 min-w-0 text-xs h-8 px-2.5 bg-transparent outline-none placeholder:text-muted-foreground/35"
						/>
						<div className="w-px bg-border/60 self-stretch shrink-0" />
						<div className="flex-1 min-w-0">
							<ExpressionInput
								value={pair.value}
								onChange={(val) => update(idx, { value: val })}
								currentNodeId={currentNodeId}
								placeholder="value"
								className=" text-xs h-8 border-0 shadow-none bg-transparent rounded-none focus-visible:ring-0 px-2.5"
							/>
						</div>
					</div>

					<button
						type="button"
						onClick={() => remove(idx)}
						className={[
							"h-6 w-6 shrink-0 flex items-center justify-center rounded",
							"text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors",
							idx < pairs.length - 1
								? "opacity-0 group-hover/kv:opacity-100 transition-opacity"
								: "opacity-0 pointer-events-none",
						].join(" ")}
					>
						<X className="h-3 w-3" />
					</button>
				</div>
			))}
		</div>
	);
};

export const KeyValueField = ({
	field,
	control,
	currentNodeId,
}: Pick<NodeFieldProps, "field" | "control" | "currentNodeId">) => (
	<FieldWrapper field={field}>
		<Controller
			name={field.name}
			control={control}
			defaultValue={{}}
			render={({ field: f }) => (
				<KeyValueEditor
					value={(f.value as Record<string, string>) ?? {}}
					onChange={f.onChange}
					currentNodeId={currentNodeId}
				/>
			)}
		/>
	</FieldWrapper>
);
