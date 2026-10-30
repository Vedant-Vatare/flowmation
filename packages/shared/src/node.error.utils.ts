type ErrorSettings = {
	onError?: "stopWorkflow" | "continueRegularOutput" | "continueErrorOutput";
	continueOnFail?: boolean;
};

export function supportsErrorOutput(task: string): boolean {
	return (
		task.startsWith("action.") &&
		!["action.loop", "action.merge"].includes(task)
	);
}

export function getNodeErrorSetting(task: string, settings: ErrorSettings) {
	if (supportsErrorOutput(task) && settings.onError) return settings.onError;
	return settings.continueOnFail ? "continueRegularOutput" : "stopWorkflow";
}

export function getNodeOutputPorts<
	T extends { name: string; label: string },
>(node: {
	task: string;
	settings: ErrorSettings;
	outputPorts?: T[] | null;
}): { name: string; label: string }[] {
	const ports = (
		node.outputPorts ?? [{ name: "default", label: "Default" }]
	).filter((port) => port.name !== "error");
	return getNodeErrorSetting(node.task, node.settings) === "continueErrorOutput"
		? [...ports, { name: "error", label: "Error" }]
		: ports;
}

export function validateErrorConnections(
	nodes: { id: string; name: string; task: string; settings: ErrorSettings }[],
	connections: { sourceId: string; sourcePort: string }[],
) {
	for (const node of nodes) {
		if (node.settings.onError && !supportsErrorOutput(node.task))
			throw new Error(`On Error is not supported for node: ${node.name}`);
		if (
			getNodeErrorSetting(node.task, node.settings) === "continueErrorOutput" &&
			!connections.some(
				(edge) => edge.sourceId === node.id && edge.sourcePort === "error",
			)
		)
			throw new Error(`Connect the Error output for node: ${node.name}`);
	}
}
