import type { CredentialDef } from "@nodebase/shared";
import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";

export function CredentialFields({
	definition,
	values,
	onChange,
	updating = false,
}: {
	definition: CredentialDef;
	values: Record<string, string>;
	onChange: (key: string, value: string) => void;
	updating?: boolean;
}) {
	const id = useId();
	const [visible, setVisible] = useState<Record<string, boolean>>({});
	if (definition.type === "oauth2") return null;
	return (
		<div className="space-y-4">
			{definition.fields.map((field) => (
				<div className="space-y-2" key={field.key}>
					<label className="text-sm font-medium" htmlFor={`${id}-${field.key}`}>
						{field.label}
					</label>
					<div className="relative">
						<Input
							id={`${id}-${field.key}`}
							type={field.secret && !visible[field.key] ? "password" : "text"}
							value={values[field.key] ?? ""}
							required={!updating}
							autoComplete="off"
							spellCheck={false}
							placeholder={
								updating ? "Leave blank to keep saved value" : field.placeholder
							}
							className={field.secret ? "pr-11" : ""}
							onChange={(event) => onChange(field.key, event.target.value)}
						/>
						{field.secret && (
							<button
								type="button"
								className="absolute right-0 top-0 flex h-full w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
								aria-label={`${visible[field.key] ? "Hide" : "Show"} ${field.label}`}
								aria-pressed={!!visible[field.key]}
								onClick={() =>
									setVisible((current) => ({
										...current,
										[field.key]: !current[field.key],
									}))
								}
							>
								{visible[field.key] ? (
									<EyeOff className="size-4" />
								) : (
									<Eye className="size-4" />
								)}
							</button>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
