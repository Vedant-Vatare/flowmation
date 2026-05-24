/* biome-ignore-all lint/suspicious/noArrayIndexKey : ignore index */

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckmarkSquare02Icon, Edit04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	extractFormSchema,
	type NodePropertyType,
	nodeSchemaRegistry,
} from "@nodebase/shared";
import { useReactFlow } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useDebounce } from "@/hooks/debounce";
import { cn } from "@/lib/utils";
import { useUpdateWorkflowNode } from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import { hasExpressionsInParams } from "@/utils/nodes/nodes.params.utils";
import { isUniqueNodeName } from "@/utils/nodes/nodes.utils";
import { Button } from "../../ui/button";
import { EditorStatusBar } from "./EditorStatusBar";
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
import { NodeConfig } from "./nodeConfig";

export const NodeField = memo(
	({ field, register, control, currentNodeId }: NodeFieldProps) => {
		const depNames = useMemo(
			() => field.dependsOn?.map((d) => d.parameter) || ["__none__"],
			[field.dependsOn],
		);

		const watchedValues = useWatch({
			control,
			name: depNames,
		});

		const visible = useMemo(() => {
			if (!field.dependsOn?.length) return true;
			return field.dependsOn.every((dep, index) => {
				const val = Array.isArray(watchedValues)
					? watchedValues[index]
					: watchedValues;
				return dep.values.includes(val);
			});
		}, [field.dependsOn, watchedValues]);

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
	},
);

const NodeNameSection = ({ node }: { node: WorkflowCanvasNode }) => {
	const { workflowId } = Route.useParams();
	const { icon: Icon, color, background, branded } = node.data.ui;
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
		updateNode({
			node: { id: node.id, task: node.data.task, name },
			workflowId,
		});
		setIsEditingName(false);
	};

	const checkForDuplicate = () => {
		const name = nodeNameRef.current?.innerText.trim();
		if (!name) return;
		setIsDuplicateName(!isUniqueNodeName(name, getNodes()));
	};
	const deboucedCheckDuplicate = useDebounce(checkForDuplicate, undefined, 200);

	return (
		<div className="relative flex gap-3 py-2 my-2 pl-2.5 items-center bg-muted p-1">
			{branded ? (
				<Icon className="size-5 rounded-sm shrink-0" />
			) : (
				<Icon
					className="size-5 p-0.5 rounded-sm shrink-0"
					style={{
						color: color ?? "currentColor",
						...(background ? { background } : {}),
					}}
				/>
			)}
			<div className="flex flex-col min-w-0">
				<span
					ref={nodeNameRef}
					className={cn("outline-none", isDuplicateName && "shake")}
					onInput={deboucedCheckDuplicate}
					suppressContentEditableWarning={true}
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
					"absolute -bottom-4 text-destructive text-xs transition-transform duration-250 ease-out pointer-events-none",
					isDuplicateName ? "block translate-y-0" : "hidden -translate-y-2.5",
				)}
			>
				Name should be unique
			</span>
		</div>
	);
};

export const NodeEditor = memo(({ node }: { node: WorkflowCanvasNode }) => {
	const { mutate: updateNode } = useUpdateWorkflowNode();
	const { workflowId } = Route.useParams();

	const defaultValues = useMemo(() => {
		const vals: Record<string, unknown> = {};
		for (const param of node.data.parameters) {
			vals[param.name] =
				param.value !== "" && param.value !== null && param.value !== undefined
					? param.value
					: (param.default ?? "");
		}
		vals.credentialId = node.data.credentialId ?? "";
		return vals;
	}, [node.data.parameters, node.data.credentialId]);

	const formSchema = useMemo(
		() =>
			extractFormSchema(
				nodeSchemaRegistry,
				node.data.task,
				node.data.parameters,
			),
		[node.data.task, node.data.parameters],
	);

	const { register, control, watch } = useForm<Record<string, unknown>>({
		defaultValues,
		resolver: zodResolver(formSchema),
		mode: "onChange",
	});

	const [editorStatus, setEditorStatus] = useState<
		"idle" | "unsaved" | "saving" | "saved" | "missing"
	>("idle");

	const userHasEdited = useRef(false);
	const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
		};
	}, []);

	const doSave = useCallback(
		(values: Record<string, unknown>) => {
			const result = formSchema?.safeParse(values);
			if (!result?.success) {
				setEditorStatus("missing");
				return;
			}

			const updatedParams = node.data.parameters.map((param) => ({
				...param,
				value: values[param.name] ?? param.value ?? "",
			}));

			const containsExpressions = updatedParams.some((p) => {
				return hasExpressionsInParams(p.value);
			});

			setEditorStatus("saving");

			updateNode(
				{
					node: {
						id: node.id,
						task: node.data.task,
						parameters: updatedParams,
						credentialId: (values.credentialId as string) || null,
						settings: {
							hasExpressions: containsExpressions,
						},
					},
					workflowId,
				},
				{
					onSuccess: () => {
						setEditorStatus("saved");
						savedTimerRef.current = setTimeout(() => {
							setEditorStatus("idle");
						}, 2000);
					},
					onError: () => setEditorStatus("idle"),
				},
			);
		},
		[
			node.data.parameters,
			node.id,
			node.data.task,
			updateNode,
			workflowId,
			formSchema,
		],
	);

	const debouncedSave = useDebounce(doSave, () => node.id);

	useEffect(() => {
		const subscription = watch((values) => {
			if (!userHasEdited.current) {
				userHasEdited.current = true;
				return;
			}
			setEditorStatus((prev) =>
				prev === "idle" || prev === "saved" ? "unsaved" : prev,
			);
			debouncedSave(values as Record<string, unknown>);
		});
		return () => subscription.unsubscribe();
	}, [watch, debouncedSave]);

	return (
		<div className="flex flex-col h-full w-full bg-background shadow-sm">
			<div className="sticky top-0 z-10 bg-background">
				<NodeNameSection node={node} />
			<EditorStatusBar status={editorStatus} />
			</div>

			<div className="flex flex-col">
				<NodeConfig
					nodeData={node.data}
					register={register}
					control={control}
				/>
			</div>
		</div>
	);
});
