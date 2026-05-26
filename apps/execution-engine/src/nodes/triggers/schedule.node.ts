import type { WorkflowJobPayload } from "@nodebase/queue";
import type { CronNode } from "@nodebase/shared";
import type { Job } from "bullmq";
import { scheduleWorkflow } from "@/services/scheduler.js";
import type { TriggerNodeExecutorOutput } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const scheduleNodeExecutor = async (
	node: CronNode,
	job: Job<WorkflowJobPayload>,
): Promise<TriggerNodeExecutorOutput> => {
	const params = await getResolvedParams(node, job.data.workflowId);

	const triggerType = params.trigger_type?.value;
	if (triggerType !== "interval" && triggerType !== "cron") {
		return { success: false, message: "Invalid trigger type" };
	}

	const rawLimit = params.limit?.value;
	const parsedLimit =
		rawLimit !== undefined && rawLimit !== null && rawLimit !== ""
			? Number(rawLimit)
			: undefined;
	const limit = Number.isFinite(parsedLimit) ? parsedLimit : undefined;

	let repeat: { every?: number; pattern?: string; limit?: number } = {};

	if (triggerType === "interval") {
		const intervalValue = params.interval_value?.value;
		const parsedValue = Number(intervalValue);
		if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
			return { success: false, message: "Invalid interval value" };
		}

		const unit = params.interval_unit?.value;
		if (
			unit !== "seconds" &&
			unit !== "minutes" &&
			unit !== "hours" &&
			unit !== "days"
		) {
			return { success: false, message: "Invalid interval unit" };
		}

		const unitToMs: Record<typeof unit, number> = {
			seconds: 1000,
			minutes: 60 * 1000,
			hours: 60 * 60 * 1000,
			days: 24 * 60 * 60 * 1000,
		};

		repeat = { every: parsedValue * unitToMs[unit], limit };
	} else if (triggerType === "cron") {
		const cronExpression = params.cron_expression?.value;
		if (typeof cronExpression !== "string" || !cronExpression.trim()) {
			return { success: false, message: "Invalid cron expression" };
		}
		repeat = { pattern: cronExpression, limit };
	}

	/* do not add workflow to scheduled runs if its for live update
    instead run immediatly */
	if (job.data.liveUpdates) {
		return { success: true, skipCurrentExecution: false };
	}
	await scheduleWorkflow(job.data.workflowId, job.data, repeat);
	return { success: true, skipCurrentExecution: true };
};
