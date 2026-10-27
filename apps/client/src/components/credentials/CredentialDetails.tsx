import { credentialRegistry } from "@nodebase/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowUpRight,
	ExternalLink,
	Loader2,
	Pencil,
	ShieldCheck,
	Trash2,
	Workflow,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type CredentialResponse,
	deleteCredential,
	fetchCredentialUsage,
	updateCredential,
} from "@/apis/credentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/utils/error";
import { CredentialFields } from "./CredentialFields";
import {
	authenticationName,
	credentialDate,
	ProviderIcon,
	providerName,
} from "./provider";
import { useCredentialOAuth } from "./useCredentialOAuth";

export function CredentialDetails({
	credential,
	onClose,
}: {
	credential: CredentialResponse;
	onClose: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [replacing, setReplacing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [name, setName] = useState(credential.name);
	const [fields, setFields] = useState<Record<string, string>>({});
	const queryClient = useQueryClient();
	const definition = credentialRegistry[credential.provider];
	const oauth = useCredentialOAuth();
	const usage = useQuery({
		queryKey: ["credentials", credential.id, "usage"],
		queryFn: () => fetchCredentialUsage(credential.id),
		staleTime: 0,
	});
	const save = useMutation({
		mutationFn: () =>
			updateCredential(credential.id, {
				name: name.trim(),
				...(replacing && Object.values(fields).some((value) => value.trim())
					? { fields }
					: {}),
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["credentials"] });
			setEditing(false);
			setReplacing(false);
			setFields({});
			toast.success("Credential updated");
		},
	});
	const remove = useMutation({
		mutationFn: () => deleteCredential(credential.id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["credentials"] });
			toast.success("Credential deleted");
			onClose();
		},
		onError: () => {
			void usage.refetch();
		},
	});
	const busy = save.isPending || remove.isPending || oauth.pending;
	const workflowCount = usage.data?.length;
	const canDelete = usage.isSuccess && workflowCount === 0 && !usage.isFetching;
	return (
		<aside
			className="credential-details"
			aria-labelledby="credential-details-title"
		>
			<div className="flex items-start justify-between gap-3 border-b p-5">
				<div className="flex min-w-0 items-center gap-3">
					<ProviderIcon provider={credential.provider} />
					<div className="min-w-0">
						<p className="mb-1 text-xs text-muted-foreground">
							{providerName(credential.provider)}
						</p>
						<h2
							id="credential-details-title"
							className="break-words text-base font-medium"
						>
							{credential.name}
						</h2>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Close credential details"
					onClick={onClose}
				>
					<X />
				</Button>
			</div>
			<div className="space-y-6 p-5">
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="credential-back -ml-2"
				>
					<ArrowLeft />
					All credentials
				</Button>
				{editing ? (
					<form
						className="space-y-5"
						onSubmit={(event) => {
							event.preventDefault();
							save.mutate();
						}}
					>
						<fieldset disabled={busy} className="space-y-5">
							<div className="space-y-2">
								<label
									htmlFor="edit-credential-name"
									className="text-sm font-medium"
								>
									Credential name
								</label>
								<Input
									id="edit-credential-name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									required
									maxLength={255}
								/>
							</div>
							{definition && definition.type !== "oauth2" && (
								<div className="space-y-4">
									<label className="flex cursor-pointer items-center gap-2 text-sm">
										<input
											className="size-4 accent-primary"
											type="checkbox"
											checked={replacing}
											onChange={(event) => {
												setReplacing(event.target.checked);
												setFields({});
											}}
										/>
										Replace saved values
									</label>
									{replacing && (
										<>
											<p className="text-xs leading-relaxed text-muted-foreground">
												Leave any field blank to keep its saved value. Your
												current values are never shown.
											</p>
											<CredentialFields
												definition={definition}
												values={fields}
												updating
												onChange={(key, value) =>
													setFields((current) => ({ ...current, [key]: value }))
												}
											/>
										</>
									)}
								</div>
							)}
						</fieldset>
						{replacing && (
							<p className="text-sm text-muted-foreground">
								Changes apply to every workflow using this credential
								{workflowCount !== undefined ? ` (${workflowCount})` : ""}.
							</p>
						)}
						{save.isError && (
							<p role="alert" className="text-sm text-destructive">
								{getErrorMessage(
									save.error,
									"Could not update the credential. Try again.",
								)}
							</p>
						)}
						<div className="flex flex-wrap gap-2">
							<Button
								className="credential-primary"
								type="submit"
								disabled={busy || !name.trim()}
							>
								{save.isPending && (
									<Loader2 className="motion-safe:animate-spin" />
								)}
								Save changes
							</Button>
							<Button
								variant="outline"
								type="button"
								disabled={busy}
								onClick={() => {
									setEditing(false);
									setFields({});
									setReplacing(false);
									save.reset();
								}}
							>
								Cancel
							</Button>
						</div>
					</form>
				) : (
					<>
						<dl className="credential-metadata">
							<div>
								<dt>Authentication</dt>
								<dd>{authenticationName(credential.type)}</dd>
							</div>
							<div>
								<dt>Created</dt>
								<dd>{credentialDate(credential.createdAt)}</dd>
							</div>
							<div>
								<dt>Last updated</dt>
								<dd>
									{credentialDate(credential.updatedAt ?? credential.createdAt)}
								</dd>
							</div>
							<div>
								<dt>Access</dt>
								<dd>Only you</dd>
							</div>
						</dl>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={busy}
								onClick={() => {
									setName(credential.name);
									setEditing(true);
									setConfirmDelete(false);
								}}
							>
								<Pencil />
								Edit credential
							</Button>
							{definition?.type === "oauth2" && (
								<Button
									variant="outline"
									size="sm"
									disabled={busy}
									onClick={() =>
										oauth.connect(
											credential.provider,
											credential.name,
											credential.id,
										)
									}
								>
									{oauth.pending ? (
										<Loader2 className="motion-safe:animate-spin" />
									) : (
										<ExternalLink />
									)}
									Reconnect
								</Button>
							)}
						</div>
						{definition?.type === "oauth2" && (
							<p className="text-xs leading-relaxed text-muted-foreground">
								When reconnecting, authorize the same account to keep your
								workflows using the intended data.
							</p>
						)}
						{oauth.pending && (
							<div className="space-y-2">
								<output className="text-sm text-muted-foreground">
									Complete authorization in the sign-in window.
								</output>
								<Button variant="ghost" size="sm" onClick={oauth.cancel}>
									Cancel authorization
								</Button>
							</div>
						)}
						{oauth.error && (
							<p role="alert" className="text-sm text-destructive">
								{oauth.error}
							</p>
						)}
					</>
				)}
				<section
					className="space-y-3 border-t pt-5"
					aria-labelledby="credential-workflows-heading"
				>
					<div className="flex items-center justify-between">
						<h3
							id="credential-workflows-heading"
							className="text-sm font-medium"
						>
							Used in workflows
						</h3>
						{workflowCount !== undefined && (
							<span className="text-xs tabular-nums text-muted-foreground">
								{workflowCount}
							</span>
						)}
					</div>
					{usage.isPending ? (
						<div>
							<output className="sr-only">Loading workflow usage</output>
							<Skeleton className="h-10 w-full" />
						</div>
					) : usage.isError ? (
						<div role="alert" className="space-y-2">
							<p className="text-sm text-destructive">
								Could not load workflow usage.
							</p>
							<Button
								variant="outline"
								size="sm"
								disabled={usage.isFetching}
								onClick={() => void usage.refetch()}
							>
								Try again
							</Button>
						</div>
					) : usage.data?.length ? (
						<ul className="divide-y">
							{usage.data.map((workflow) => (
								<li key={workflow.id}>
									<Link
										to="/workflow/$workflowId"
										params={{ workflowId: workflow.id }}
										className="flex min-h-12 items-center gap-2 rounded-md py-2 text-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
									>
										<Workflow className="size-4 shrink-0 text-muted-foreground" />
										<span className="min-w-0 flex-1 break-words">
											{workflow.name || "Untitled workflow"}
										</span>
										<ArrowUpRight
											className="size-4 shrink-0"
											aria-hidden="true"
										/>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm leading-relaxed text-muted-foreground">
							No saved workflows use this credential yet. Select it in an
							integration node to get started.
						</p>
					)}
					<p className="text-xs leading-relaxed text-muted-foreground">
						Includes saved drafts and published versions.
					</p>
				</section>
				<div className="flex items-start gap-2 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
					<ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<p>
						Secret values are encrypted when stored and never returned to this
						page. Saving a credential does not verify that it works.
					</p>
				</div>
				{!editing && (
					<section
						className="space-y-3 border-t pt-5"
						aria-label="Delete credential"
					>
						{confirmDelete ? (
							<>
								<p className="text-sm font-medium">Delete this credential?</p>
								<p className="text-xs leading-relaxed text-muted-foreground">
									This cannot be undone. You will need to add the account again
									to use it later.
								</p>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="destructive"
										size="sm"
										disabled={busy || !canDelete}
										onClick={() => remove.mutate()}
									>
										{remove.isPending ? (
											<Loader2 className="motion-safe:animate-spin" />
										) : (
											<Trash2 />
										)}
										Delete permanently
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={busy}
										onClick={() => {
											setConfirmDelete(false);
											remove.reset();
										}}
									>
										Cancel
									</Button>
								</div>
							</>
						) : (
							<>
								<Button
									variant="ghost"
									size="sm"
									className="-ml-2 text-destructive hover:text-destructive"
									disabled={busy || !canDelete}
									onClick={() => setConfirmDelete(true)}
								>
									<Trash2 />
									Delete credential
								</Button>
								<p className="text-xs leading-relaxed text-muted-foreground">
									{workflowCount
										? "Replace this credential in its workflows before deleting it."
										: !canDelete
											? "Workflow usage must be checked before deletion."
											: "Only unused credentials can be deleted."}
								</p>
							</>
						)}
						{remove.isError && (
							<p role="alert" className="text-sm text-destructive">
								{getErrorMessage(
									remove.error,
									"Could not delete the credential. Try again.",
								)}
							</p>
						)}
					</section>
				)}
			</div>
		</aside>
	);
}
