export type NodeExecutorOutput = {
	success?: boolean;
	message?: string;
	output?: unknown;
	status?: "completed" | "waiting" | "stopped";
	allowedOutputPorts?: string[];
};

export type TriggerNodeExecutorOutput = NodeExecutorOutput & {
	// if current trigger node and workflow should be executed or not and be marked as executed
	skipCurrentExecution?: boolean;
};
