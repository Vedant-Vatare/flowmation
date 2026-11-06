import { SWITCH_CASE_LIMIT, type SwitchCase } from "@nodebase/shared";
import { useStore } from "@xyflow/react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { type Control, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpressionInput } from "./ExpressionInput";

export function SwitchCasesField({
	control,
	nodeId,
}: {
	control: Control<Record<string, unknown>>;
	nodeId: string;
}) {
	const edges = useStore((state) => state.edges);

	return (
		<Controller
			control={control}
			name="cases"
			render={({ field, fieldState }) => {
				const cases = field.value as SwitchCase[];
				return (
					<fieldset
						className="flex flex-col gap-3 border-b border-border/50 px-3 py-3"
						onBlur={field.onBlur}
					>
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-medium">Cases</span>
							<span className="text-xs text-muted-foreground">
								{cases.length} / {SWITCH_CASE_LIMIT}
							</span>
						</div>
						<p className="text-xs text-muted-foreground">
							The first matching case runs. Blank cases are skipped.
						</p>
						{cases.map((entry, index) => {
							const connected = edges.some(
								(edge) =>
									edge.source === nodeId && edge.sourceHandle === entry.id,
							);
							const label = `Case ${index + 1}`;
							const update = (patch: Partial<typeof entry>) =>
								field.onChange(
									cases.map((item) =>
										item.id === entry.id ? { ...item, ...patch } : item,
									),
								);
							const move = (offset: number) => {
								const next = [...cases];
								next.splice(index, 1);
								next.splice(index + offset, 0, entry);
								field.onChange(next);
							};
							return (
								<div
									key={entry.id}
									className="flex min-w-0 flex-col gap-2 rounded-md border border-border px-2 py-2"
								>
									<div className="flex items-center gap-1">
										<Input
											className="min-w-0"
											aria-label={`${label} output label`}
											placeholder={label}
											maxLength={60}
											value={entry.label}
											onChange={(event) =>
												update({ label: event.target.value })
											}
										/>
										<Button
											type="button"
											size="icon-sm"
											variant="ghost"
											aria-label={`Move ${label} up`}
											disabled={index === 0}
											onClick={() => move(-1)}
										>
											<ArrowUp />
										</Button>
										<Button
											type="button"
											size="icon-sm"
											variant="ghost"
											aria-label={`Move ${label} down`}
											disabled={index === cases.length - 1}
											onClick={() => move(1)}
										>
											<ArrowDown />
										</Button>
										<Button
											type="button"
											size="icon-sm"
											variant="ghost"
											aria-label={`Remove ${label}`}
											disabled={connected}
											onClick={() =>
												field.onChange(
													cases.filter((item) => item.id !== entry.id),
												)
											}
										>
											<Trash2 />
										</Button>
									</div>
									<label
										htmlFor={`switch-value-${entry.id}`}
										className="sr-only"
									>
										{label} match value
									</label>
									<ExpressionInput
										id={`switch-value-${entry.id}`}
										currentNodeId={nodeId}
										value={entry.value}
										onChange={(value) => update({ value })}
										placeholder="Value to match"
									/>
									{connected && (
										<p className="text-xs text-muted-foreground">
											Disconnect this output to remove the case.
										</p>
									)}
								</div>
							);
						})}
						{fieldState.error && (
							<p role="alert" className="text-xs text-destructive">
								{fieldState.error.message ?? "Check the case settings."}
							</p>
						)}
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="self-start"
							disabled={cases.length >= SWITCH_CASE_LIMIT}
							onClick={() =>
								field.onChange([
									...cases,
									{ id: crypto.randomUUID(), label: "", value: "" },
								])
							}
						>
							<Plus /> Add case
						</Button>
					</fieldset>
				);
			}}
		/>
	);
}
