import type { WaitNode } from "@nodebase/shared";
import { retainExecutionOutputsForWait } from "@/services/executionStore.js";
import type { NodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const waitNodeExecutor = async (
	node: WaitNode,
	executionId: string,
): Promise<NodeExecutorOutput> => {
	const timeUnitsToMs = {
		seconds: 1000,
		minutes: 60000,
		hours: 3600000,
		days: 86400000,
	} as const;

	let delay: number = 0;

	const params = await getResolvedParams(node, executionId);

	if (params.start.value === "time_period") {
		if (!params.wait_time_period.value) {
			return {
				success: false,
				message: "waiting time is not specified",
			};
		}
		const val = Number(params.wait_time_period.value);
		if (Number.isNaN(val)) {
			return {
				success: false,
				message: "time period value could not be parsed to number",
			};
		}
		delay =
			val * timeUnitsToMs[params.time_unit.value as keyof typeof timeUnitsToMs];
	} else {
		if (!params.date_time.value) {
			return {
				success: false,
				message: "date & time is not specified",
			};
		}

		const timestamp = new Date(params.date_time.value);
		delay = timestamp.getTime() - Date.now();

		if (delay <= 0) {
			return { success: false, message: "date & time must be in the future" };
		}
	}

	if (!Number.isFinite(delay) || delay <= 0) {
		return {
			success: false,
			message: "Waiting time must be a positive finite duration",
		};
	}
	await retainExecutionOutputsForWait(executionId, delay);
	return {
		success: true,
		status: "waiting",
		message: `delay set successfully for ${new Date(delay)}`,
		output: { delay },
	};
};
