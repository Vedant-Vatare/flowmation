import { useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { WorkflowNodeData } from "@/constants/nodes";
import { API_KEY_PROVIDERS } from "@nodebase/shared";
import { useNodeCredentialProvider } from "@/hooks/nodes";
import { useGetCredentials, useSaveApiKey } from "@/queries/credentials";

const truncateEmail = (name: string, maxLen = 28) => {
	if (name.length <= maxLen) return name;
	const atIndex = name.lastIndexOf("@");
	if (atIndex === -1) return `${name.slice(0, maxLen)}...`;
	const local = name.slice(0, atIndex);
	const domain = name.slice(atIndex);
	const available = maxLen - domain.length - 3;
	if (available < 2) return `${name.slice(0, maxLen)}...`;
	return `${local.slice(0, available)}...${domain}`;
};

export const NodeCredentials = memo(
	({
		nodeData,
		control,
	}: {
		nodeData: WorkflowNodeData;
		control: Control<Record<string, unknown>>;
	}) => {
		const { icon: Icon } = nodeData.ui;
		const getCredentialProvider = useNodeCredentialProvider();
		const provider = getCredentialProvider(nodeData.task);
		const {
			data: credentials = [],
			isLoading,
			isFetching,
		} = useGetCredentials();
		const queryClient = useQueryClient();
		const saveApiKeyMutation = useSaveApiKey();
		const [apiKey, setApiKey] = useState("");
		const [credName, setCredName] = useState("");
		const [showForm, setShowForm] = useState(false);

		useEffect(() => {
			const handleMessage = (event: MessageEvent) => {
				if (event?.data?.type === "OAUTH_SUCCESS") {
					queryClient.invalidateQueries({ queryKey: ["credentials"] });
				}
			};

			window.addEventListener("message", handleMessage);
			return () => window.removeEventListener("message", handleMessage);
		}, [queryClient]);

		const isApiKeyProvider = provider
			? API_KEY_PROVIDERS.includes(provider)
			: false;

		const handleSaveApiKey = useCallback(async () => {
			if (!provider || !apiKey.trim()) return;
			saveApiKeyMutation.mutate(
				{
					provider,
					apiKey,
					name: credName.trim() || `${provider} API Key`,
				},
				{
					onSuccess: () => {
						setApiKey("");
						setCredName("");
						setShowForm(false);
					},
				},
			);
		}, [provider, apiKey, credName, saveApiKeyMutation]);

		if (!provider) return null;

		const providerCredentials = credentials.filter(
			(c) => c.provider === provider,
		);

		const handleConnect = () => {
			const apiUrl = import.meta.env.VITE_API_URL;
			const token = localStorage.getItem("token");
			const label = encodeURIComponent(nodeData.name);

			const width = 600;
			const height = 700;
			const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
			const top = Math.round(
				window.screenY + (window.outerHeight - height) / 2,
			);

			window.open(
				`${apiUrl}/credentials/oauth/${provider}/connect?source=popup&token=${token}&label=${label}`,
				"oauth_popup",
				`width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`,
			);
		};

		if (isLoading || isFetching) return null;

		return (
			<div className="flex flex-col gap-2 px-3 py-3 border-b border-border/50">
				<div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 leading-none">
					Credentials
				</div>

				{providerCredentials.length > 0 && (
					<Controller
						control={control}
						name="credentialId"
						render={({ field }) => (
							<Select
								value={(field.value as string) || ""}
								onValueChange={field.onChange}
							>
								<SelectTrigger className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
									<SelectValue
										placeholder={`Select a ${provider} account...`}
									/>
								</SelectTrigger>
								<SelectContent>
									{providerCredentials.map((cred) => (
										<SelectItem key={cred.id} value={cred.id} title={cred.name}>
											<span className="truncate block max-w-55">
												{truncateEmail(cred.name)}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				)}

				{isApiKeyProvider ? (
					showForm ? (
						<div className="flex flex-col gap-2">
							<Input
								placeholder="Credential name"
								value={credName}
								onChange={(e) => setCredName(e.target.value)}
								className="rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-auto"
							/>
							<Input
								placeholder="sk-..."
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								type="password"
								className="rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-auto"
							/>
							<div className="flex items-center gap-2 pt-1">
								<Button
									variant="secondary"
									size="sm"
									onClick={handleSaveApiKey}
									disabled={saveApiKeyMutation.isPending || !apiKey.trim()}
									type="button"
								>
									{saveApiKeyMutation.isPending ? "Saving..." : "Save"}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setShowForm(false);
										setApiKey("");
										setCredName("");
									}}
									type="button"
								>
									Cancel
								</Button>
							</div>
						</div>
					) : (
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 self-start"
							onClick={() => setShowForm(true)}
							type="button"
						>
							<Icon className="size-4" />
							Add {provider} API Key
						</Button>
					)
				) : (
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5 self-start"
						onClick={handleConnect}
						type="button"
					>
						<Icon className="size-4" />
						Add {provider} Account
					</Button>
				)}
			</div>
		);
	},
);
