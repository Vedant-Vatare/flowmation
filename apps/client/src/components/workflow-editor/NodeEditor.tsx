/* biome-ignore-all lint/suspicious/noArrayIndexKey : ignore index */

import { CheckmarkSquare02Icon, Edit04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { NodeParameters, NodePropertyType } from "@nodebase/shared";
import { useReactFlow } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useDebounce } from "@/hooks/debounce";
import { cn } from "@/lib/utils";
import { useUpdateWorkflowNode } from "@/queries/userWorkflows";
import { isUniqueNodeName } from "@/utils/nodes/nodes.utils";
import { Button } from "../ui/button";
import {
	ArrayField,
	BooleanField,
	CheckboxField,
	DateField,
	DateTimeField,
	DropdownField,
	InputField,
	KeyValueField,
	type NodeFieldProps,
	NumberField,
	RadioField,
	TextareaField,
} from "./NodeFields";

function allRequiredFilled(
	params: NodeParameters[],
	formValues: Record<string, unknown>,
): boolean {
	return params
		.filter((p) => p.required)
		.filter((p) => {
			if (!p.dependsOn || p.dependsOn.length === 0) return true;
			return p.dependsOn.every((dep) => {
				const depValue = formValues[dep.parameter];
				return dep.values.includes(depValue);
			});
		})
		.every((p) => {
			const v = formValues[p.name];
			if (
				v === null ||
				v === undefined ||
				v === "" ||
				(typeof v === "number" && Number.isNaN(v))
			)
				return false;
			if (Array.isArray(v)) return v.length > 0;
			return true;
		});
}

function useIsVisible(
	field: NodeParameters,
	allValues: Record<string, unknown>,
): boolean {
	if (!field.dependsOn?.length) return true;
	return field.dependsOn.every(({ parameter, values }) =>
		values.includes(allValues[parameter]),
	);
}

export const NodeField = ({
	field,
	register,
	control,
	allValues,
	currentNodeId,
}: NodeFieldProps & { allValues: Record<string, unknown> }) => {
	const visible = useIsVisible(field, allValues);
	if (!visible) return null;

	const shared = { field, register, control, currentNodeId };

	switch (field.type as NodePropertyType) {
		case "input":
			return <InputField {...shared} />;
		case "number":
			return <NumberField {...shared} />;
		case "textarea":
			return <TextareaField {...shared} />;
		case "boolean":
			return <BooleanField {...shared} />;
		case "checkbox":
			return <CheckboxField {...shared} />;
		case "radio":
			return <RadioField {...shared} />;
		case "dropdown":
			return <DropdownField {...shared} />;
		case "date":
			return <DateField {...shared} />;
		case "date-time":
			return <DateTimeField {...shared} />;
		case "array":
			return <ArrayField {...shared} />;
		case "key-value":
			return <KeyValueField {...shared} />;
		default:
			return <InputField {...shared} />;
	}
};

const NodeNameSection = ({ node }: { node: WorkflowCanvasNode }) => {
	const { icon: Icon, color, background } = node.data.ui;
	const [isEditingName, setIsEditingName] = useState(false);
	const [isDuplicateName, setIsDuplicateName] = useState(false);
	const { getNodes } = useReactFlow<WorkflowCanvasNode>();
	const nodeNameRef = useRef<HTMLElement | null>(null);
	const { mutate: updateNode } = useUpdateWorkflowNode();

	const editNodeName = () => {
		if (!nodeNameRef.current) return;
		setIsEditingName(true);
		setIsDuplicateName(false);

		nodeNameRef.current.contentEditable = "true";
		nodeNameRef.current.focus();
		const range = document.createRange();
		const sel = window.getSelection();
		range.selectNodeContents(nodeNameRef.current);
		range.collapse(false);
		sel?.removeAllRanges();
		sel?.addRange(range);
	};

	const saveNodeName = () => {
		if (!nodeNameRef.current) return;
		const name = nodeNameRef.current?.innerText.trim();
		if (!name || isDuplicateName) {
			nodeNameRef.current.focus();
			return;
		}

		node.data.name = name;
		nodeNameRef.current.contentEditable = "false";
		updateNode({ id: node.id, task: node.data.task, name });
		setIsEditingName(false);
	};

	const checkForDuplicate = () => {
		const name = nodeNameRef.current?.innerText.trim();
		if (!name) return;
		setIsDuplicateName(!isUniqueNodeName(name, getNodes()));
	};
	const deboucedCheckDuplicate = useDebounce(checkForDuplicate, undefined, 200);

	return (
		<div className="relative flex gap-3 py-2 my-2 items-center bg-muted p-1">
			<Icon
				className="h-6 w-6 p-1 rounded-sm shrink-0"
				style={{
					color: color ?? "currentColor",
					background: background ?? "#21212A",
				}}
			/>
			<div className="flex flex-col min-w-0">
				<span
					ref={nodeNameRef}
					className={cn("outline-none", isDuplicateName && "shake")}
					onInput={deboucedCheckDuplicate}
				>
					{node.data.name}
				</span>
			</div>
			<div className="ml-auto mr-1 cursor-pointer opacity-75">
				{isEditingName ? (
					<Button onClick={saveNodeName} variant={"default"} size={"icon-sm"}>
						<HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} />
					</Button>
				) : (
					<Button onClick={editNodeName} variant={"ghost"} size={"icon-sm"}>
						<HugeiconsIcon icon={Edit04Icon} size={14} />
					</Button>
				)}
			</div>
			<span
				className={cn(
					"absolute -bottom-4 text-destructive text-xs transition-transform duration-250 ease-out",
					isDuplicateName
						? "translate-y-0"
						: "-translate-y-1 pointer-events-none",
				)}
			>
				Name should be unique
			</span>
		</div>
	);
};

export const NodeEditor = memo(({ node }: { node: WorkflowCanvasNode }) => {
	const { mutate: updateNode } = useUpdateWorkflowNode();

	const defaultValues = useMemo(() => {
		const vals: Record<string, unknown> = {};
		for (const param of node.data.parameters) {
			vals[param.name] =
				param.value !== "" && param.value !== null && param.value !== undefined
					? param.value
					: (param.default ?? "");
		}
		return vals;
	}, [node.data.parameters]);

	const { register, control, watch } = useForm<Record<string, unknown>>({
		defaultValues,
		mode: "onChange",
	});

	const [editorStatus, setEditorStatus] = useState<
		"idle" | "saving" | "missing"
	>("idle");

	const userHasEdited = useRef(false);

	const doSave = useCallback(
		(values: Record<string, unknown>) => {
			if (!allRequiredFilled(node.data.parameters, values)) {
				setEditorStatus("missing");
				return;
			}

			const updatedParams = node.data.parameters.map((param) => ({
				...param,
				value: values[param.name] ?? param.value ?? "",
			}));

			setEditorStatus("saving");
			updateNode(
				{
					id: node.id,
					task: node.data.task,
					parameters: updatedParams,
				},
				{
					onSettled: () => setEditorStatus("idle"),
				},
			);
		},
		[node, updateNode],
	);

	const debouncedSave = useDebounce(doSave, () => node.id);

	useEffect(() => {
		const subscription = watch((values) => {
			if (!userHasEdited.current) {
				userHasEdited.current = true;
				return;
			}
			debouncedSave(values as Record<string, unknown>);
		});
		return () => subscription.unsubscribe();
	}, [watch, debouncedSave]);

	const allValues = useWatch({ control }) as Record<string, unknown>;

	return (
		<div className="flex flex-col  w-full bg-background shadow-sm">
			<NodeNameSection node={node} />
			<div className="flex text-xs pl-1.5 items-center gap-1.5 min-w-0 h-1 mb-3">
				{editorStatus === "saving" ? (
					<span className="text-white/40 flex items-center gap-1">
						<Loader2 className="h-3 w-3 animate-spin" />
						Saving…
					</span>
				) : editorStatus === "missing" ? (
					<span className="text-amber-400/70 truncate">
						Required fields missing
					</span>
				) : null}
			</div>

			<div className="flex flex-col">
				{node.data.parameters.length === 0 ? (
					<p className="px-3 py-4 text-xs text-muted-foreground text-center italic">
						No parameters to configure.
					</p>
				) : (
					node.data.parameters.map((param) => (
						<NodeField
							key={param.name}
							field={param}
							register={register}
							control={control}
							allValues={allValues}
							currentNodeId={node.id}
						/>
					))
				)}
			</div>
		</div>
	);
});
