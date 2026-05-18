import { useQueryClient } from "@tanstack/react-query";
import { memo, useEffect } from "react";
import { type Control, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { WorkflowNodeData } from "@/constants/nodes";
import { useNodeCredentialProvider } from "@/hooks/nodes";
import { useGetCredentials } from "@/queries/credentials";

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
		const queryClient = useQueryClient();
		const {
			data: credentials = [],
			isLoading,
			isFetching,
		} = useGetCredentials();

		useEffect(() => {
			const handleMessage = (event: MessageEvent) => {
				if (event?.data?.type === "OAUTH_SUCCESS") {
					queryClient.invalidateQueries({ queryKey: ["credentials"] });
				}
			};

			window.addEventListener("message", handleMessage);
			return () => window.removeEventListener("message", handleMessage);
		}, [queryClient]);

		if (!provider) return null;

		const providerCredentials = credentials.filter(
			(c) => c.provider === provider,
		);

		const handleConnect = () => {
			const apiUrl = import.meta.env.VITE_API_URL;
			const token = localStorage.getItem("token");

			const width = 600;
			const height = 700;
			const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
			const top = Math.round(
				window.screenY + (window.outerHeight - height) / 2,
			);

			window.open(
				`${apiUrl}/credentials/oauth/${provider}/connect?source=popup&token=${token}`,
				"oauth_popup",
				`width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`,
			);
		};

		if (isLoading || isFetching) return null;

		return (
			<div className="space-y-3 mb-6 px-1">
				<div className="text-muted-foreground uppercase text-xs font-semibold tracking-wider">
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
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={`Select a ${provider} account...`}
									/>
								</SelectTrigger>
								<SelectContent>
									{providerCredentials.map((cred) => (
										<SelectItem key={cred.id} value={cred.id}>
											{cred.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				)}

				<Button
					variant="outline"
					size="icon-lg"
					className="w-[95%] mx-auto mt-2 gap-2 flex items-center"
					onClick={handleConnect}
					type="button"
				>
					<Icon className="size-6 p-1 rounded-sm" />
					Add {provider} Account
				</Button>
			</div>
		);
	},
);
