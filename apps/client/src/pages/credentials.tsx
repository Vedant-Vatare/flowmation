import { useQuery } from "@tanstack/react-query";
import {
	ChevronRight,
	KeyRound,
	Plus,
	Search,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { fetchCredentials } from "@/apis/credentials";
import { AddCredential } from "@/components/credentials/AddCredential";
import { CredentialDetails } from "@/components/credentials/CredentialDetails";
import {
	authenticationName,
	credentialDate,
	ProviderIcon,
	providerName,
} from "@/components/credentials/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/utils/error";
import "./credentials.css";

export function CredentialsPage() {
	const query = useQuery({
		queryKey: ["credentials"],
		queryFn: fetchCredentials,
		staleTime: 30_000,
	});
	const [search, setSearch] = useState("");
	const [provider, setProvider] = useState("all");
	const [authentication, setAuthentication] = useState("all");
	const [sort, setSort] = useState<"name" | "newest" | "oldest">("name");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [adding, setAdding] = useState(false);
	const credentials = query.data ?? [];
	const selected = credentials.find(
		(credential) => credential.id === selectedId,
	);
	const appOptions = [
		...new Set(credentials.map((credential) => credential.provider)),
	].sort((a, b) => providerName(a).localeCompare(providerName(b)));
	const filtered = credentials
		.filter(
			(credential) =>
				(provider === "all" || credential.provider === provider) &&
				(authentication === "all" || credential.type === authentication) &&
				`${credential.name} ${providerName(credential.provider)}`
					.toLowerCase()
					.includes(search.trim().toLowerCase()),
		)
		.sort((a, b) =>
			sort === "name"
				? a.name.localeCompare(b.name)
				: (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) *
					(sort === "newest" ? 1 : -1),
		);
	const resetFilters = () => {
		setSearch("");
		setProvider("all");
		setAuthentication("all");
	};
	const hasFilters = !!search || provider !== "all" || authentication !== "all";

	return (
		<div
			className={`credentials-page ${selected ? "credentials-has-selection" : ""}`}
		>
			<section
				className="credentials-main"
				aria-labelledby="credentials-heading"
			>
				<div className="credentials-heading">
					<div>
						<h1
							id="credentials-heading"
							className="text-2xl font-semibold tracking-tight"
						>
							Credentials
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Manage the accounts your workflows use.
						</p>
					</div>
					<Button
						className="credential-primary"
						onClick={() => setAdding(true)}
					>
						<Plus />
						Add credential
					</Button>
				</div>
				{query.isError && (
					<div
						role="alert"
						className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"
					>
						<div>
							<p className="text-sm font-medium">
								{query.data
									? "Could not refresh credentials"
									: "Could not load credentials"}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{getErrorMessage(
									query.error,
									"Check your connection and try again.",
								)}
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							disabled={query.isFetching}
							onClick={() => void query.refetch()}
						>
							Try again
						</Button>
					</div>
				)}
				{query.isPending ? (
					<div className="space-y-4" aria-busy="true">
						<output className="sr-only">Loading credentials</output>
						<Skeleton className="h-10 w-full motion-reduce:animate-none" />
						{[1, 2, 3, 4].map((row) => (
							<Skeleton
								key={row}
								className="h-16 w-full motion-reduce:animate-none"
							/>
						))}
					</div>
				) : query.data && credentials.length === 0 ? (
					<div className="credential-empty">
						<span className="mb-5 flex size-12 items-center justify-center rounded-xl border bg-muted/50">
							<KeyRound className="size-5 text-primary" aria-hidden="true" />
						</span>
						<h2 className="text-lg font-medium">
							Your first connection starts here
						</h2>
						<p className="mt-2 max-w-85 text-sm leading-relaxed text-muted-foreground">
							Connect an app once, then reuse its credential across your
							workflows.
						</p>
						<Button
							className="credential-primary mt-6"
							onClick={() => setAdding(true)}
						>
							<Plus />
							Add credential
						</Button>
						<p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
							<ShieldCheck className="size-3.5" aria-hidden="true" />
							Secrets are encrypted when stored.
						</p>
					</div>
				) : query.data ? (
					<>
						<div className="credential-toolbar">
							<div className="credential-search relative">
								<Search
									className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
									aria-hidden="true"
								/>
								<Input
									className="h-10 pl-9"
									aria-label="Search credentials"
									placeholder="Search by name or app…"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
								/>
							</div>
							<Select value={provider} onValueChange={setProvider}>
								<SelectTrigger
									aria-label="Filter by app"
									className="credential-filter"
								>
									<SelectValue placeholder="All apps" />
								</SelectTrigger>
								<SelectContent position="popper" align="start">
									<SelectItem value="all">All apps</SelectItem>
									{appOptions.map((app) => (
										<SelectItem key={app} value={app}>
											{providerName(app)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select value={authentication} onValueChange={setAuthentication}>
								<SelectTrigger
									aria-label="Filter by authentication"
									className="credential-filter"
								>
									<SelectValue placeholder="All authentication" />
								</SelectTrigger>
								<SelectContent position="popper" align="start">
									<SelectItem value="all">All authentication</SelectItem>
									<SelectItem value="oauth">OAuth 2.0</SelectItem>
									<SelectItem value="apiKey">API key</SelectItem>
									<SelectItem value="database">Database</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
							<output className="text-xs text-muted-foreground">
								{filtered.length}{" "}
								{filtered.length === 1 ? "credential" : "credentials"}
								{hasFilters ? ` of ${credentials.length}` : ""}
							</output>
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<span id="credential-sort-label">Sort by</span>
								<Select
									value={sort}
									onValueChange={(value) => {
										if (
											value === "name" ||
											value === "newest" ||
											value === "oldest"
										)
											setSort(value);
									}}
								>
									<SelectTrigger
										aria-label="Sort credentials"
										aria-describedby="credential-sort-label"
										size="sm"
										className="min-w-32 text-xs"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent position="popper" align="end">
										<SelectItem value="name">Name</SelectItem>
										<SelectItem value="newest">Newest first</SelectItem>
										<SelectItem value="oldest">Oldest first</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						{filtered.length === 0 ? (
							<div className="credential-empty min-h-64">
								<Search className="mb-4 size-6 text-muted-foreground" />
								<h2 className="text-base font-medium">
									No matching credentials
								</h2>
								<p className="mt-2 text-sm text-muted-foreground">
									Try another name or clear your filters.
								</p>
								<Button
									variant="outline"
									className="mt-5"
									onClick={resetFilters}
								>
									Clear filters
								</Button>
							</div>
						) : (
							<div className="credential-table rounded-lg border">
								<Table>
									<colgroup>
										<col className="credential-name-column" />
										<col className="credential-auth-column" />
										<col className="credential-usage-column" />
										<col className="credential-created credential-date-column" />
										<col className="credential-action-column" />
									</colgroup>
									<TableHeader>
										<TableRow className="bg-muted/40 hover:bg-muted/40">
											<TableHead
												className="credential-name-heading"
												aria-sort={sort === "name" ? "ascending" : undefined}
											>
												Name
											</TableHead>
											<TableHead>Authentication</TableHead>
											<TableHead className="text-right">Workflows</TableHead>
											<TableHead
												className="credential-created"
												aria-sort={
													sort === "name"
														? undefined
														: sort === "newest"
															? "descending"
															: "ascending"
												}
											>
												Created
											</TableHead>
											<TableHead>
												<span className="sr-only">Details</span>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filtered.map((credential) => (
											<TableRow
												key={credential.id}
												className="credential-row"
												data-state={
													selectedId === credential.id ? "selected" : undefined
												}
												aria-selected={selectedId === credential.id}
											>
												<TableCell className="pl-4">
													<button
														type="button"
														className="credential-name-button"
														aria-expanded={selectedId === credential.id}
														onClick={() => setSelectedId(credential.id)}
													>
														<ProviderIcon provider={credential.provider} />
														<span className="min-w-0">
															<span
																className="block truncate font-medium"
																title={credential.name}
															>
																{credential.name}
															</span>
															<span className="mt-1 block text-xs text-muted-foreground">
																{providerName(credential.provider)}
															</span>
														</span>
													</button>
												</TableCell>
												<TableCell>
													<span className="credential-auth-label">
														{authenticationName(credential.type)}
													</span>
												</TableCell>
												<TableCell className="text-right text-muted-foreground tabular-nums">
													{credential.workflowCount ?? "—"}
												</TableCell>
												<TableCell className="credential-created text-xs text-muted-foreground">
													{credentialDate(credential.createdAt)}
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label={`View ${credential.name}`}
														onClick={() => setSelectedId(credential.id)}
													>
														<ChevronRight className="size-4" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
						<p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
							<ShieldCheck
								className="mt-0.5 size-3.5 shrink-0"
								aria-hidden="true"
							/>
							<span>
								Private to you. Reuse credentials across workflows without
								exposing saved secrets.
							</span>
						</p>
					</>
				) : null}
			</section>
			{selected && (
				<CredentialDetails
					key={selected.id}
					credential={selected}
					onClose={() => setSelectedId(null)}
				/>
			)}
			<AddCredential open={adding} onOpenChange={setAdding} />
		</div>
	);
}
