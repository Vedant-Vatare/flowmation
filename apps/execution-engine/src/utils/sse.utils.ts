import { sseClients } from "@/services/sseServer.js";

export type ExecutionUpdate =
	| {
			type: "workflow:completed";
			completedAt: Date;
	  }
	| {
			type: "workflow:failed";
			error: string;
	  }
	| {
			type: "node:started";
			nodeId: string;
			startedAt: Date;
	  }
	| {
			type: "node:completed";
			nodeId: string;
			output: unknown;
			completedAt: Date;
	  }
	| {
			type: "node:failed";
			nodeId: string;
			error: string;
	  };

export const broadcastExecutionUpdate = (
	jobData: {
		liveUpdates?: boolean;
		executionId: string;
	},
	executionUpdate: ExecutionUpdate,
) => {
	if (!jobData.liveUpdates) return null;

	const controller = sseClients.get(jobData.executionId);
	if (!controller) return;

	controller.enqueue(`data: ${JSON.stringify(executionUpdate)}\n\n`);

	if (
		executionUpdate.type === "workflow:completed" ||
		executionUpdate.type === "workflow:failed"
	) {
		controller.close();
		sseClients.delete(jobData.executionId);
	}
};
