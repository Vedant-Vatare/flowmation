import type { Control, UseFormRegister } from "react-hook-form";
import type { WorkflowNodeData } from "@/constants/nodes";
import { NodeField } from "./NodeEditor";
import { NodeInfo, nodesWithInfo } from "./NodeInfoSection";

type NodeConfig = {
	nodeData: WorkflowNodeData;
	register: UseFormRegister<Record<string, unknown>>;
	control: Control<Record<string, unknown>>;
};

const NodeParameters = ({ nodeData, register, control }: NodeConfig) => {
	return nodeData.parameters.map((param) => (
		<NodeField
			key={param.name}
			field={param}
			register={register}
			control={control}
			currentNodeId={nodeData.id}
		/>
	));
};

const checkNodeConfigs = (nodeData: WorkflowNodeData): boolean => {
	if (nodeData.parameters.length > 0) return true;

	if (nodeData.credentials && Object.keys(nodeData.credentials).length > 0)
		return true;

	if (nodeData.settings && Object.keys(nodeData.settings).length > 0)
		return true;

	if (nodesWithInfo.includes(nodeData.task as (typeof nodesWithInfo)[number]))
		return true;

	return false;
};

export const NodeConfig = ({ nodeData, register, control }: NodeConfig) => {
	const hasConfigs = checkNodeConfigs(nodeData);

	if (!hasConfigs) {
		return (
			<p className="px-3 py-4 text-xs text-muted-foreground text-center italic">
				No configurations are required.
			</p>
		);
	}

	return (
		<>
			<NodeInfo nodeData={nodeData} />
			<NodeParameters
				nodeData={nodeData}
				register={register}
				control={control}
			/>
		</>
	);
};
