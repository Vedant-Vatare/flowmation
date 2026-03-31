import type { WorkflowJobPayload } from "@nodebase/queue";
import type { Job } from "bullmq";
import { scheduleWorkflow } from "@/services/scheduler.js";
import type { CronNode } from "@/types/nodes.js";
import { getResolvedParams } from "@/utils/node.executor.utils.js";

export const scheduleNodeExecutor = async (
	node: CronNode,
	job: Job<WorkflowJobPayload>,
) => {
	const params = await getResolvedParams(node, job.data.workflowId);

	const triggerType = params.trigger_type.value;
	const limit = params.limit.value ? Number(params.limit.value) : undefined;

	let repeat: { every?: number; pattern?: string; limit?: number } = {};

	if (triggerType === "interval") {
		const value = Number(params.interval_value.value);
		const unit = params.interval_unit.value;

		const unitToMs: Record<typeof unit, number> = {
			seconds: 1000,
			minutes: 60 * 1000,
			hours: 60 * 60 * 1000,
			days: 24 * 60 * 60 * 1000,
		};

		repeat = { every: value * unitToMs[unit], limit };
	} else if (triggerType === "cron") {
		repeat = { pattern: params.cron_expression.value, limit };
	}

	await scheduleWorkflow(job.data.workflowId, job.data, repeat);
	return;
};
