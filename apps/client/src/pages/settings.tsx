import { startRegistration } from "@simplewebauthn/browser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Check, KeyRound, Monitor, Moon, Pencil, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	type Account,
	connectAccountGoogle,
	getAccount,
	removePasskey,
	updateAccount,
} from "@/apis/account";
import GoogleIcon from "@/assets/icons/nodes/google.svg?react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePasskeyRegistration } from "@/queries/auth";
import { getErrorMessage } from "@/utils/error";
import "./settings.css";

const tabs = [
	{ name: "Account", to: "/settings" },
	{ name: "Appearance", to: "/settings/appearance" },
	{ name: "Security", to: "/settings/security" },
	{ name: "Credentials", to: "/settings/credentials" },
] as const;
const useAccount = () =>
	useQuery({ queryKey: ["account"], queryFn: getAccount, staleTime: 60_000 });
const neutral =
	"bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/30";

export function SettingsLayout() {
	const path = useRouterState({
		select: (state) => state.location.pathname.replace(/\/$/, ""),
	});
	return (
		<div className="settings-page">
			<div className="settings-heading">
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
			</div>
			<nav className="settings-tabs" aria-label="Settings sections">
				{tabs.map((tab) => (
					<Link
						key={tab.to}
						to={tab.to}
						activeOptions={{ exact: true }}
						aria-current={path === tab.to ? "page" : undefined}
						className="settings-tab"
					>
						{tab.name}
					</Link>
				))}
			</nav>
			<div className="settings-content">
				<Outlet />
			</div>
		</div>
	);
}

function AccountStatus({
	pending,
	error,
	retry,
}: {
	pending: boolean;
	error: Error | null;
	retry: () => void;
}) {
	if (pending)
		return (
			<div aria-busy="true" className="settings-form space-y-6">
				<div className="h-12 rounded-md bg-muted animate-pulse" />
				<div className="h-12 rounded-md bg-muted animate-pulse" />
				<span className="sr-only">Loading account</span>
			</div>
		);
	if (error)
		return (
			<div role="alert" className="settings-form">
				<p className="text-sm text-destructive">{getErrorMessage(error)}</p>
				<Button className="mt-4" variant="outline" onClick={retry}>
					Try again
				</Button>
			</div>
		);
	return null;
}

export function AccountSettings() {
	const query = useAccount();
	const client = useQueryClient();
	const [editing, setEditing] = useState<"name" | "email" | null>(null);
	const [value, setValue] = useState("");
	const [editField, setEditField] = useState<"name" | "email">("name");
	const editButton = useRef<HTMLButtonElement>(null);
	const search = useRouterState({
		select: (state) => state.location.searchStr,
	});
	const googleResult = new URLSearchParams(search).get("google");
	const googleErrors: Record<string, string> = {
		email_mismatch: "Choose the Google account matching the email you entered.",
		unsupported_email:
			"Use a Gmail or Google Workspace address to change your email.",
		failed: "Could not verify Google. Try again.",
	};
	const save = useMutation({
		mutationFn: updateAccount,
		onSuccess: async () => {
			await Promise.all([
				client.invalidateQueries({ queryKey: ["account"] }),
				client.invalidateQueries({ queryKey: ["current-user"] }),
			]);
			setEditing(null);
			toast.success("Name updated");
		},
	});
	const google = useMutation({
		mutationFn: connectAccountGoogle,
		onSuccess: ({ url }) => window.location.assign(url),
	});
	const busy = save.isPending || google.isPending;
	if (!query.data)
		return (
			<AccountStatus
				pending={query.isPending}
				error={query.error}
				retry={() => void query.refetch()}
			/>
		);
	const account = query.data;
	return (
		<section className="settings-form" aria-label="Account details">
			{(["name", "email"] as const).map((field) => (
				<div className="settings-row settings-value-row" key={field}>
					<span className="text-sm font-medium">
						{field === "name" ? "Name" : "Email"}
					</span>
					<div className="flex min-w-0 items-center justify-end gap-3">
						<p className="min-w-0 wrap-break-word text-right text-sm ">
							{account[field]}
						</p>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label={`Edit ${field}`}
							disabled={busy}
							onClick={(event) => {
								editButton.current = event.currentTarget;
								save.reset();
								google.reset();
								setValue(account[field]);
								setEditField(field);
								setEditing(field);
							}}
						>
							<Pencil
								className="size-3.5 text-muted-foreground"
								aria-hidden="true"
							/>
						</Button>
					</div>
				</div>
			))}
			<div className="flex items-center justify-between gap-4 border-b py-6">
				<div className="flex items-center gap-3">
					<GoogleIcon className="size-5" aria-hidden="true" />
					<span className="text-sm font-medium">Google</span>
				</div>
				{account.googleConnected ? (
					<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Check className="size-4" aria-hidden="true" />
						Connected
					</span>
				) : (
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						onClick={() => {
							google.reset();
							google.mutate(undefined);
						}}
					>
						{google.isPending ? "Connecting…" : "Connect"}
					</Button>
				)}
			</div>
			{google.error && !editing && (
				<p role="alert" className="mt-4 text-sm text-destructive">
					{getErrorMessage(google.error)}
				</p>
			)}
			{googleResult && googleErrors[googleResult] && (
				<p role="alert" className="mt-4 text-sm text-destructive">
					{googleErrors[googleResult]}
				</p>
			)}
			<Dialog
				open={!!editing}
				onOpenChange={(open) => {
					if (!open && !busy) setEditing(null);
				}}
			>
				<DialogContent
					aria-describedby={undefined}
					showCloseButton={false}
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						editButton.current?.focus();
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{editField === "email" ? "Edit email" : "Edit name"}
						</DialogTitle>
					</DialogHeader>
					<form
						className="grid gap-4"
						onSubmit={(event) => {
							event.preventDefault();
							if (!editing || busy || !value.trim()) return;
							if (editing === "name") save.mutate(value.trim());
							else google.mutate(value.trim().toLowerCase());
						}}
					>
						<div className="grid gap-2">
							<Label htmlFor="account-edit-value">
								{editField === "email" ? "Email" : "Name"}
							</Label>
							<Input
								id="account-edit-value"
								type={editField === "email" ? "email" : "text"}
								autoComplete={editField === "email" ? "email" : "name"}
								maxLength={255}
								required
								disabled={busy}
								value={value}
								onChange={(event) => setValue(event.target.value)}
							/>
						</div>
						{(save.error || google.error) && (
							<p role="alert" className="text-sm text-destructive">
								{getErrorMessage(save.error || google.error)}
							</p>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								disabled={busy}
								onClick={() => setEditing(null)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="secondary"
								className={neutral}
								disabled={
									busy || !value.trim() || value.trim() === account[editField]
								}
							>
								{busy ? "Saving…" : "Save"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	);
}

export function AppearanceSettings() {
	const { theme, setTheme } = useTheme();
	return (
		<section className="settings-form" aria-labelledby="appearance-title">
			<div className="settings-row">
				<div>
					<h2 id="appearance-title" className="text-sm font-medium">
						Theme
					</h2>
				</div>
				<fieldset className="grid grid-cols-3 gap-2">
					<legend className="sr-only">Color theme</legend>
					{[
						{ value: "light", label: "Light", Icon: Sun },
						{ value: "dark", label: "Dark", Icon: Moon },
						{ value: "system", label: "System", Icon: Monitor },
					].map(({ value, label, Icon }) => (
						<label key={value} className="settings-theme">
							<input
								type="radio"
								name="theme"
								value={value}
								checked={theme === value}
								onChange={() => setTheme(value)}
								className="peer sr-only"
							/>
							<span className="flex flex-col items-center gap-3 rounded-md border px-3 py-5 text-sm text-muted-foreground peer-checked:border-foreground/60 peer-checked:bg-muted peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/50">
								<Icon className="size-5" aria-hidden="true" />
								{label}
							</span>
						</label>
					))}
				</fieldset>
			</div>
		</section>
	);
}

type Passkey = Account["passkeys"][number];
function usedDate(value: string | null) {
	return value
		? new Date(value).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: "Never used";
}

export function SecuritySettings() {
	const query = useAccount();
	const client = useQueryClient();
	const { generate, verify } = usePasskeyRegistration();
	const [adding, setAdding] = useState(false);
	const [registrationError, setRegistrationError] = useState("");
	const actionRef = useRef<HTMLButtonElement>(null);
	const [removing, setRemoving] = useState<Passkey | null>(null);
	const refresh = () => client.invalidateQueries({ queryKey: ["account"] });
	const remove = useMutation({
		mutationFn: removePasskey,
		onSuccess: async () => {
			await refresh();
			setRemoving(null);
			toast.success("Passkey removed");
		},
	});
	async function addPasskey() {
		if (adding) return;
		setAdding(true);
		setRegistrationError("");
		try {
			const options = await generate.mutateAsync();
			const response = await startRegistration({ optionsJSON: options });
			if (!(await verify.mutateAsync(response)))
				throw new Error("Could not register this passkey");
			await refresh();
			toast.success("Passkey added");
		} catch (error) {
			setRegistrationError(getErrorMessage(error));
		} finally {
			setAdding(false);
		}
	}
	if (!query.data)
		return (
			<AccountStatus
				pending={query.isPending}
				error={query.error}
				retry={() => void query.refetch()}
			/>
		);
	const protectedLast =
		!query.data.googleConnected && query.data.passkeys.length === 1;
	return (
		<section className="settings-form" aria-labelledby="passkeys-title">
			<div className="flex flex-wrap items-start justify-between gap-4 pb-6">
				<div>
					<h2 id="passkeys-title" className="text-sm font-medium">
						Passkeys
					</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						Manage how you sign in.
					</p>
				</div>
				<Button
					variant="outline"
					disabled={adding}
					onClick={() => void addPasskey()}
				>
					<KeyRound aria-hidden="true" />
					{adding ? "Waiting for device…" : "Add passkey"}
				</Button>
			</div>
			{registrationError && (
				<p role="alert" className="mb-4 text-sm text-destructive">
					{registrationError}
				</p>
			)}
			{query.data.googleConnected && (
				<p className="mb-4 text-xs text-muted-foreground">
					Google sign-in is also connected.
				</p>
			)}
			{query.data.passkeys.length === 0 ? (
				<p className="border-y py-8 text-sm text-muted-foreground">
					No passkeys yet. Add one to sign in with your device.
				</p>
			) : (
				<ul className="divide-y border-y">
					{query.data.passkeys.map((passkey) => (
						<li
							key={passkey.id}
							className="flex flex-wrap items-center justify-between gap-3 py-5"
						>
							<div className="min-w-0 flex-1 basis-44">
								<p className="wrap-break-word text-sm font-medium">
									{passkey.name}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{passkey.lastUsedAt
										? `Last used ${usedDate(passkey.lastUsedAt)}`
										: usedDate(null)}
								</p>
							</div>
							<div className="flex gap-1">
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive"
									disabled={protectedLast || adding}
									onClick={(event) => {
										actionRef.current = event.currentTarget;
										remove.reset();
										setRemoving(passkey);
									}}
								>
									Remove
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}
			{protectedLast && (
				<p className="mt-3 text-xs text-muted-foreground">
					Add another passkey before removing your only sign-in method.
				</p>
			)}
			<Dialog
				open={!!removing}
				onOpenChange={(open) => {
					if (!open && !remove.isPending) setRemoving(null);
				}}
			>
				<DialogContent
					showCloseButton={!remove.isPending}
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						actionRef.current?.focus();
					}}
				>
					<DialogHeader>
						<DialogTitle>Remove passkey?</DialogTitle>
						<DialogDescription>
							<span className="wrap-break-word">{removing?.name}</span> will no
							longer work for sign-in.
						</DialogDescription>
					</DialogHeader>
					{remove.error && (
						<p role="alert" className="text-sm text-destructive">
							{getErrorMessage(remove.error)}
						</p>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							disabled={remove.isPending}
							onClick={() => setRemoving(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={remove.isPending}
							onClick={() => {
								if (removing) remove.mutate(removing.id);
							}}
						>
							{remove.isPending ? "Removing…" : "Remove passkey"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}
