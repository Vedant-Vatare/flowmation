import type { DiscordNode } from "@nodebase/shared";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const discordNodeExecutor = async (
	node: DiscordNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	try {
		const params = await getResolvedParams(node, executionId);

		const webhookResponse = await fetch(params.webhookUrl.value, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: params.message.value,
				username: params.botName.value || undefined,
			}),
		});

		if (!webhookResponse.ok) {
			const error = await webhookResponse.text();
			return { success: false, message: error };
		}

		return {
			success: true,
			status: "completed",
			message: "webhook request was sent",
			output: webhookResponse.status,
		};
	} catch (e) {
		console.log("error in discord node execution", e);
		return { success: false, message: "failed to send webhook request" };
	}
};
