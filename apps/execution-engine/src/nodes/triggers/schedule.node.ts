import type { WorkflowJobPayload } from "@nodebase/queue";
import type { CronNode } from "@nodebase/shared";
import { parseScheduleParams } from "@nodebase/shared/utils";
import type { Job } from "bullmq";
import type { TriggerNodeExecutorOutput } from "@/types/nodes.js";

export const scheduleNodeExecutor = async (
	node: CronNode,
	job: Job<WorkflowJobPayload>,
): Promise<TriggerNodeExecutorOutput> => {
	const repeat = parseScheduleParams(node);

	if (!repeat) {
		return { success: false, message: "Invalid schedule configuration" };
	}

	/* test mode: run immediately without setting up scheduler */
	if (job.data.liveUpdates) {
		return { success: true, skipCurrentExecution: false };
	}

	/* production: cron is already registered at publish time, nothing to do here */
	return { success: true, skipCurrentExecution: true };
};
