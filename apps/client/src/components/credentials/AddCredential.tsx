import { credentialRegistry } from "@nodebase/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	ExternalLink,
	KeyRound,
	Loader2,
	Search,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saveApiKey } from "@/apis/credentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/utils/error";
import { CredentialFields } from "./CredentialFields";
import {
	authenticationName,
	ProviderIcon,
	providerName,
	providers,
} from "./provider";
import { useCredentialOAuth } from "./useCredentialOAuth";

export function AddCredential({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="credential-add-sheet w-full gap-0 sm:max-w-lg">
				{open && <AddCredentialContent onDone={() => onOpenChange(false)} />}
			</SheetContent>
		</Sheet>
	);
}

function AddCredentialContent({ onDone }: { onDone: () => void }) {
	const [provider, setProvider] = useState("");
	const [search, setSearch] = useState("");
	const [name, setName] = useState("");
	const [fields, setFields] = useState<Record<string, string>>({});
	const queryClient = useQueryClient();
	const oauth = useCredentialOAuth(onDone);
	const definition = credentialRegistry[provider];
	const save = useMutation({
		mutationFn: () => saveApiKey(provider, { ...fields, name: name.trim() }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["credentials"] });
			toast.success("Credential added");
			onDone();
		},
	});
	const filteredProviders = providers.filter(([key]) =>
		providerName(key).toLowerCase().includes(search.trim().toLowerCase()),
	);
	const busy = save.isPending || oauth.pending;
	return (
		<>
			<SheetHeader className="border-b p-6 pr-12">
				<SheetTitle>
					{definition ? `Connect ${providerName(provider)}` : "Add credential"}
				</SheetTitle>
				<SheetDescription>
					{definition
						? "Give this account a name you will recognize in your workflows."
						: "Choose the app or service you want to use in your workflows."}
				</SheetDescription>
			</SheetHeader>
			<div className="min-h-0 flex-1 overflow-y-auto p-6">
				{!definition ? (
					<>
						<div className="relative mb-5">
							<Search
								className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<Input
								aria-label="Search apps"
								placeholder="Search apps…"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								className="h-10 pl-9"
							/>
						</div>
						<div className="divide-y">
							{filteredProviders.map(([key, def]) => (
								<button
									type="button"
									key={key}
									className="flex min-h-16 w-full items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
									onClick={() => {
										setProvider(key);
										setName(`${providerName(key)} account`);
									}}
								>
									<ProviderIcon provider={key} />
									<span className="min-w-0 flex-1">
										<span className="block text-sm font-medium">
											{providerName(key)}
										</span>
										<span className="block text-xs text-muted-foreground">
											{authenticationName(def.type)}
										</span>
									</span>
									<ArrowRight
										className="size-4 text-muted-foreground"
										aria-hidden="true"
									/>
								</button>
							))}
						</div>
						{filteredProviders.length === 0 && (
							<p className="py-8 text-center text-sm text-muted-foreground">
								No apps match your search.
							</p>
						)}
					</>
				) : (
					<form
						className="space-y-6"
						onSubmit={(event) => {
							event.preventDefault();
							if (definition.type === "oauth2")
								oauth.connect(provider, name.trim());
							else save.mutate();
						}}
					>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="-ml-2"
							disabled={busy}
							onClick={() => {
								setProvider("");
								setFields({});
								save.reset();
								oauth.cancel();
							}}
						>
							<ArrowLeft />
							All apps
						</Button>
						<div className="flex items-center gap-3">
							<ProviderIcon provider={provider} />
							<div>
								<p className="text-sm font-medium">{providerName(provider)}</p>
								<p className="text-xs text-muted-foreground">
									{authenticationName(definition.type)}
								</p>
							</div>
						</div>
						<fieldset disabled={busy} className="space-y-5">
							<div className="space-y-2">
								<label
									htmlFor="new-credential-name"
									className="text-sm font-medium"
								>
									Credential name
								</label>
								<Input
									id="new-credential-name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									required
									maxLength={255}
									autoComplete="off"
								/>
							</div>
							{definition.type === "oauth2" ? (
								<div className="space-y-3 border-y py-5">
									<p className="text-sm">
										You will sign in to {providerName(provider)} in a separate
										window and choose which account to connect.
									</p>
									<details className="text-sm">
										<summary className="cursor-pointer text-muted-foreground">
											Requested permissions
										</summary>
										<ul className="mt-3 list-inside list-disc space-y-2 text-xs text-muted-foreground">
											{definition.scopes.length ? (
												definition.scopes.map((scope) => (
													<li className="break-all" key={scope}>
														{scope}
													</li>
												))
											) : (
												<li>
													Permissions are provided by {providerName(provider)}{" "}
													during sign-in.
												</li>
											)}
										</ul>
									</details>
								</div>
							) : (
								<CredentialFields
									definition={definition}
									values={fields}
									onChange={(key, value) =>
										setFields((current) => ({ ...current, [key]: value }))
									}
								/>
							)}
						</fieldset>
						<div className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
							<ShieldCheck
								className="mt-0.5 size-4 shrink-0"
								aria-hidden="true"
							/>
							<p>
								Your secrets are encrypted when stored. Saved values are never
								displayed here.
							</p>
						</div>
						{save.isError && (
							<p role="alert" className="text-sm text-destructive">
								{getErrorMessage(
									save.error,
									"Could not save the credential. Please try again.",
								)}
							</p>
						)}
						{oauth.error && (
							<p role="alert" className="text-sm text-destructive">
								{oauth.error}
							</p>
						)}
						{oauth.pending && (
							<output className="text-sm text-muted-foreground">
								Complete authorization in the sign-in window.
							</output>
						)}
						<div className="flex flex-wrap gap-2">
							<Button
								className="credential-primary"
								type="submit"
								disabled={busy || !name.trim()}
							>
								{busy ? (
									<Loader2 className="motion-safe:animate-spin" />
								) : definition.type === "oauth2" ? (
									<ExternalLink />
								) : (
									<KeyRound />
								)}
								{save.isPending
									? "Saving…"
									: oauth.pending
										? "Waiting for authorization…"
										: definition.type === "oauth2"
											? `Sign in with ${providerName(provider)}`
											: "Save credential"}
							</Button>
							<Button
								type="button"
								variant="outline"
								disabled={save.isPending}
								onClick={() => {
									oauth.cancel();
									onDone();
								}}
							>
								Cancel
							</Button>
						</div>
					</form>
				)}
			</div>
		</>
	);
}
