import type { Control, UseFormRegister } from "react-hook-form";
import type { WorkflowNodeData } from "@/constants/nodes";
import { useNodeCredentialProvider } from "@/hooks/nodes";
import { NodeCredentials } from "./NodeCredentials";
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

const checkNodeConfigs = (
	nodeData: WorkflowNodeData,
	credentialprovider: string | undefined,
): boolean => {
	if (nodeData.parameters.length > 0) return true;

	if (credentialprovider) return true;

	if (nodeData.settings && Object.keys(nodeData.settings).length > 0)
		return true;

	if (nodesWithInfo.includes(nodeData.task as (typeof nodesWithInfo)[number]))
		return true;

	return false;
};

const SectionDivider = () => <div className="h-px bg-border/20 mx-3" />;

export const NodeConfig = ({ nodeData, register, control }: NodeConfig) => {
	const getCredentialProvider = useNodeCredentialProvider();
	const credentialprovider = getCredentialProvider(nodeData.task);
	const hasConfigs = checkNodeConfigs(nodeData, credentialprovider);
	const showInfo = nodesWithInfo.includes(
		nodeData.task as (typeof nodesWithInfo)[number],
	);
	const showCredentials = !!credentialprovider;

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
			{showInfo && showCredentials && <SectionDivider />}
			<NodeCredentials nodeData={nodeData} control={control} />
			{showCredentials && nodeData.parameters.length > 0 && <SectionDivider />}
			<NodeParameters
				nodeData={nodeData}
				register={register}
				control={control}
			/>
		</>
	);
};
