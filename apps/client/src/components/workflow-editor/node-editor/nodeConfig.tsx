import type { Control, UseFormRegister } from "react-hook-form";
import type { WorkflowNodeData } from "@/constants/nodes";
import { useNodeCredentialProvider } from "@/hooks/nodes";
import { NodeActions, nodesWithActions } from "./NodeActions";
import { NodeCredentials } from "./NodeCredentials";
import { NodeField } from "./NodeEditor";
import { NodeSettings } from "./NodeSettings";

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

	if (
		nodesWithActions.includes(
			nodeData.task as (typeof nodesWithActions)[number],
		)
	)
		return true;

	return false;
};

const SectionDivider = () => <div className="h-px bg-border/20 mx-3" />;

export const NodeConfig = ({ nodeData, register, control }: NodeConfig) => {
	const getCredentialProvider = useNodeCredentialProvider();
	const credentialprovider = getCredentialProvider(nodeData.task);
	const hasConfigs = checkNodeConfigs(nodeData, credentialprovider);
	const showInfo = nodesWithActions.includes(
		nodeData.task as (typeof nodesWithActions)[number],
	);
	const showCredentials = !!credentialprovider;

	if (!hasConfigs) {
		return (
			<p className="px-3 py-4 text-xs text-muted-foreground text-center italic">
				No configurations are required.
			</p>
		);
	}

	const showSettings =
		nodeData.settings &&
		Object.entries(nodeData.settings).some(
			([k, v]) => k !== "hasExpressions" && v !== undefined && v !== null,
		);

	return (
		<>
			<NodeActions nodeData={nodeData} />
			{showInfo && showCredentials && <SectionDivider />}
			<NodeCredentials nodeData={nodeData} control={control} />
			{showCredentials && nodeData.parameters.length > 0 && <SectionDivider />}
			<NodeParameters
				nodeData={nodeData}
				register={register}
				control={control}
			/>
			{(showInfo || showCredentials || nodeData.parameters.length > 0) &&
				showSettings && <SectionDivider />}
			<NodeSettings nodeData={nodeData} register={register} control={control} />
		</>
	);
};
