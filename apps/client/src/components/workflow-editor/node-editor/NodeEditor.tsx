/* biome-ignore-all lint/suspicious/noArrayIndexKey : ignore index */

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckmarkSquare02Icon, Edit04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	extractFormSchema,
	getNodeErrorSetting,
	type NodePropertyType,
	type NodeSettings,
	NodeSettingsSchema,
	nodeParamValueRegistry,
	supportsErrorOutput,
} from "@nodebase/shared";
import { useReactFlow } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { WorkflowCanvasNode } from "@/constants/nodes";
import { useDebounce } from "@/hooks/debounce";
import { useNodeCredentialProvider } from "@/hooks/nodes";
import { cn } from "@/lib/utils";
import { useUpdateWorkflowNode } from "@/queries/userWorkflows";
import { Route } from "@/routes/_mainLayout/workflow/$workflowId";
import { useWorkflowSidbarTabsStore } from "@/store/workflow/useWorkflowEditor";
import { useWorkflowStore } from "@/store/workflow/useWorkflowStore";
import { hasExpressionsInParams } from "@/utils/nodes/nodes.params.utils";
import { isUniqueNodeName } from "@/utils/nodes/nodes.utils";
import { Button } from "../../ui/button";
import { EditorStatusBar } from "./EditorStatusBar";
import {
	type ConfigurationIssue,
	NodeConfigurationIssues,
} from "./NodeConfigurationIssues";
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
import { getEditableNodeSettings } from "./nodeSettings.utils";

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
	const {
		icon: Icon,
		color,
		background,
		iconBackground,
		branded,
	} = node.data.ui;
	const [isEditingName, setIsEditingName] = useState(false);
	const [errorInNodeName, setErrorInNodeName] = useState<null | string>(null);
	const { getNodes } = useReactFlow<WorkflowCanvasNode>();
	const nodeNameRef = useRef<HTMLElement | null>(null);
	const { mutate: updateNode } = useUpdateWorkflowNode(node.id);

	const editNodeName = () => {
		if (!nodeNameRef.current) return;
		setIsEditingName(true);
		setErrorInNodeName(null);

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
		const name = nodeNameRef.current.innerText.replace(/[^\w\s-]/g, "").trim();
		if (!name || errorInNodeName) {
			nodeNameRef.current.focus();
			return;
		}

		nodeNameRef.current.contentEditable = "false";
		updateNode({
			node: { id: node.id, task: node.data.task, name },
			workflowId,
		});
		setIsEditingName(false);
	};

	const checkNodeName = () => {
		if (!nodeNameRef.current) return;

		const name = nodeNameRef.current.innerText.trim();
		if (!name) return;

		if (/[^\w\s-]/.test(name)) {
			setErrorInNodeName("name contains invalid character(s)");
			return;
		}

		if (!isUniqueNodeName(name, getNodes(), node.id)) {
			setErrorInNodeName("Name should be unique");
			return;
		}

		setErrorInNodeName(null);
	};
	const deboucedCheckNodeName = useDebounce(checkNodeName, undefined, 50);

	return (
		<div className="relative flex gap-3 py-2 my-2 pl-2.5 items-center bg-muted p-1">
			<div
				className="size-6 p-0.5 rounded-sm shrink-0 flex items-center justify-center"
				style={{ background: iconBackground ?? background }}
			>
				{branded ? (
					<Icon className="size-5 rounded-sm shrink-0" />
				) : (
					<Icon
						className="size-5 p-0.5 rounded-sm shrink-0"
						style={{ color: color ?? "currentColor" }}
					/>
				)}
			</div>
			<div className="flex flex-col min-w-0">
				<span
					ref={nodeNameRef}
					className={cn("outline-none", errorInNodeName && "shake")}
					onInput={deboucedCheckNodeName}
					suppressContentEditableWarning={true}
				>
					{node.data.name}
				</span>
			</div>
			<div className="ml-auto mr-1 cursor-pointer opacity-75 shrink-0">
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
					"absolute left-0 right-0 top-[110%] text-destructive text-xs px-2.5 py-1 bg-background",
					errorInNodeName ? "block" : "hidden",
				)}
			>
				{errorInNodeName}
			</span>
		</div>
	);
};

export const NodeEditor = memo(({ node }: { node: WorkflowCanvasNode }) => {
	const { mutateAsync: updateNode } = useUpdateWorkflowNode(node.id);
	const { getNodes } = useReactFlow<WorkflowCanvasNode>();
	const mountedRef = useRef(false);
	const { workflowId } = Route.useParams();
	const getCredentialProvider = useNodeCredentialProvider();
	const getNodeDraft = useCallback(
		() => useWorkflowStore.getState().nodeDrafts[node.id],
		[node.id],
	);

	const defaultValues = useMemo(() => {
		const values: Record<string, unknown> = {};
		for (const param of node.data.parameters) {
			values[param.name] =
				param.value !== "" && param.value !== null && param.value !== undefined
					? param.value
					: (param.default ?? "");
		}
		values.credentialId = node.data.credentialId ?? "";
		if (node.data.settings) {
			for (const [key, value] of Object.entries(
				getEditableNodeSettings(node.data.task, node.data.settings),
			)) {
				if (key !== "hasExpressions" && value !== undefined && value !== null) {
					values[key] = value;
				}
			}
		}
		if (supportsErrorOutput(node.data.task))
			values.onError = getNodeErrorSetting(
				node.data.task,
				node.data.settings ?? {},
			);
		return { ...values, ...getNodeDraft() };
	}, [
		getNodeDraft,
		node.data.parameters,
		node.data.credentialId,
		node.data.settings,
		node.data.task,
	]);

	const formSchema = useMemo(() => {
		const parameterSchemas = extractFormSchema(
			nodeParamValueRegistry,
			node.data.task,
			node.data.parameters,
		).shape;
		return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
			if (getCredentialProvider(node.data.task, values) && !values.credentialId)
				ctx.addIssue({
					code: "custom",
					path: ["credentialId"],
					message: "Select a connected account or add one below.",
				});
			for (const param of node.data.parameters) {
				if (param.dependsOn?.length) {
					const isActive = param.dependsOn.every((d) =>
						d.values.includes(values[d.parameter]),
					);
					if (!isActive) continue;
				}
				const val = values[param.name];
				if (
					param.required &&
					(val === undefined || val === null || val === "")
				) {
					ctx.addIssue({
						code: "custom",
						path: [param.name],
						message: `${param.label ?? param.name} is required`,
					});
					continue;
				}
				const schema = parameterSchemas[param.name];
				const result = schema ? z.safeParse(schema, val) : undefined;
				if (result && !result.success) {
					let issue = result.error.issues[0];
					while (issue?.code === "invalid_union") {
						const valueIssue = issue.errors.at(-1)?.[0];
						if (!valueIssue) break;
						issue = valueIssue;
					}
					ctx.addIssue({
						code: "custom",
						path: [param.name],
						message: issue?.message ?? "Check this value.",
					});
				}
			}
			for (const field of ["retryCount", "timeout"] as const) {
				if (!NodeSettingsSchema.shape[field].safeParse(values[field]).success) {
					ctx.addIssue({
						code: "custom",
						path: [field],
						message:
							field === "retryCount"
								? "Enter a whole number from 0 to 3."
								: "Enter a whole number from 0 to 30,000 ms. Use 0 for no timeout.",
					});
				}
			}
		});
	}, [node.data.task, node.data.parameters, getCredentialProvider]);

	const {
		register,
		control,
		watch,
		trigger,
		getValues,
		getFieldState,
		clearErrors,
		formState: { errors },
	} = useForm<Record<string, unknown>>({
		defaultValues,
		resolver: zodResolver(formSchema),
		mode: "onTouched",
	});
	const previouslyReported = useRef(
		!!useWorkflowStore.getState().nodeConfigurationIssues[node.id]?.length,
	);
	useEffect(() => {
		if (!previouslyReported.current) return;
		if (formSchema.safeParse(getValues()).success) clearErrors();
		else void trigger();
	}, [trigger, formSchema, getValues, clearErrors]);
	const validateOnCloseRef = useRef<
		((values: Record<string, unknown>) => void) | null
	>(null);
	useEffect(() => {
		validateOnCloseRef.current = (values) => {
			const result = formSchema.safeParse(values);
			const messages = result.success
				? []
				: result.error.issues.map((issue) => issue.message);
			useWorkflowStore.getState().setNodeConfigurationIssues(node.id, messages);
			if (mountedRef.current) {
				previouslyReported.current = true;
				void trigger();
			}
		};
	}, [formSchema, node.id, trigger]);
	const configurationIssues = useMemo(() => {
		const labels: Record<string, string> = {
			credentialId: "Connected account",
			retryCount: "Retry attempts",
			timeout: "Execution timeout",
		};
		return Object.entries(errors).map(
			([field, error]): ConfigurationIssue => ({
				field,
				label:
					labels[field] ??
					node.data.parameters.find((p) => p.name === field)?.label ??
					field,
				message:
					typeof error?.message === "string"
						? error.message
						: "Check this value.",
			}),
		);
	}, [errors, node.data.parameters]);
	useEffect(() => {
		useWorkflowStore.getState().setNodeConfigurationIssues(
			node.id,
			configurationIssues.map((issue) => `${issue.label}: ${issue.message}`),
		);
	}, [node.id, configurationIssues]);
	const focusIssue = (field: string) => {
		if (field === "retryCount" || field === "timeout") {
			const toggle = document.getElementById("node-settings-toggle");
			if (toggle?.getAttribute("data-state") === "closed") toggle.click();
		}
		requestAnimationFrame(() => {
			const target =
				document.getElementById(field) ??
				document.getElementById(`${field}-field`);
			target?.scrollIntoView({ behavior: "smooth", block: "center" });
			if (target?.matches("input, textarea, button, select")) target.focus();
			else
				target
					?.querySelector<HTMLElement>("input, textarea, button, select")
					?.focus();
		});
	};

	const [editorStatus, setEditorStatus] = useState<
		"idle" | "unsaved" | "saving" | "saved"
	>(getNodeDraft() ? "unsaved" : "idle");

	const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
		};
	}, []);

	const doSave = useCallback(
		async (values: Record<string, unknown>) => {
			let updatedSettings: NodeSettings = {
				...getEditableNodeSettings(node.data.task, node.data.settings),
				hasExpressions: node.data.settings.hasExpressions,
			};
			if (supportsErrorOutput(node.data.task))
				updatedSettings.onError = values.onError as NodeSettings["onError"];

			for (const [key, _v] of Object.entries(updatedSettings)) {
				if (key === "hasExpressions") continue;
				const formValue = values[key];
				if (formValue !== undefined) {
					updatedSettings = { ...updatedSettings, [key]: formValue };
				}
			}

			const invalid = async () => {
				const currentSettings = getEditableNodeSettings(
					node.data.task,
					node.data.settings,
				);
				if (
					NodeSettingsSchema.safeParse(updatedSettings).success &&
					JSON.stringify(updatedSettings) !== JSON.stringify(currentSettings)
				) {
					try {
						await updateNode({
							node: {
								id: node.id,
								task: node.data.task,
								settings: {
									...updatedSettings,
									hasExpressions: node.data.settings.hasExpressions,
								},
							},
							workflowId,
						});
					} catch (error) {
						toast.error(
							error instanceof Error
								? error.message
								: "Could not save node settings",
						);
					}
				}
				if (mountedRef.current) {
					setEditorStatus("unsaved");
				}
			};
			if (
				getCredentialProvider(node.data.task, values) &&
				!values.credentialId
			) {
				await invalid();
				return;
			}
			const result = formSchema?.safeParse(values);
			if (!result?.success) {
				await invalid();
				return;
			}

			const updatedParams = node.data.parameters.map((param) => {
				const value = values[param.name] ?? param.value ?? "";
				const hidden = param.dependsOn?.some(
					(dependency) =>
						!dependency.values.includes(values[dependency.parameter]),
				);
				const schema = nodeParamValueRegistry.get(node.data.task)?.[param.name];
				if (hidden && schema && !schema.safeParse(value).success) return param;
				return { ...param, value };
			});

			const containsExpressions = updatedParams.some((p) => {
				return hasExpressionsInParams(p.value);
			});
			updatedSettings.hasExpressions = containsExpressions;

			if (mountedRef.current) setEditorStatus("saving");

			try {
				await updateNode({
					node: {
						id: node.id,
						task: node.data.task,
						parameters: updatedParams,
						credentialId: (values.credentialId as string) || null,
						settings: updatedSettings,
					},
					workflowId,
				});
				useWorkflowStore.getState().clearNodeDraft(node.id, values);
				if (!mountedRef.current) return;
				if (getNodeDraft()) {
					setEditorStatus("unsaved");
					return;
				}
				setEditorStatus("saved");
				if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
				savedTimerRef.current = setTimeout(() => {
					setEditorStatus("idle");
				}, 2000);
			} catch {
				if (mountedRef.current) setEditorStatus("unsaved");
				toast.error(
					node.data.name +
						": could not save.\nReopen or edit the node to retry.",
				);
			}
		},
		[
			getCredentialProvider,
			getNodeDraft,
			node.data.parameters,
			node.id,
			node.data.task,
			updateNode,
			workflowId,
			formSchema,
			node.data.settings,
			node.data.name,
		],
	);

	const saveRef = useRef(doSave);
	useEffect(() => {
		saveRef.current = doSave;
	}, [doSave]);

	useEffect(() => {
		mountedRef.current = true;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let pending = getNodeDraft();
		const flush = () => {
			clearTimeout(timer);
			if (!pending) return;
			const values = pending;
			pending = undefined;
			void saveRef.current(values);
		};
		const schedule = () => {
			clearTimeout(timer);
			timer = setTimeout(flush, 2000);
		};
		if (pending) schedule();
		const subscription = watch((values, { type }) => {
			if (type !== "change") return;
			const reportedFields = Object.keys(values).filter((name) => {
				const field = getFieldState(name);
				return field.isTouched || !!field.error;
			});
			if (reportedFields.length) void trigger(reportedFields);
			if (savedTimerRef.current !== null) {
				clearTimeout(savedTimerRef.current);
				savedTimerRef.current = null;
			}
			pending = structuredClone(values) as Record<string, unknown>;
			useWorkflowStore.getState().setNodeDraft(node.id, pending);
			setEditorStatus("unsaved");
			schedule();
		});
		const unsubscribeSidebar = useWorkflowSidbarTabsStore.subscribe(
			(state, previous) => {
				if (
					(previous.sidebarOpen && !state.sidebarOpen) ||
					(previous.tabOpen === "editor" && state.tabOpen !== "editor")
				) {
					validateOnCloseRef.current?.(getValues());
					flush();
				}
			},
		);
		return () => {
			mountedRef.current = false;
			subscription.unsubscribe();
			unsubscribeSidebar();
			if (getNodes().some((candidate) => candidate.id === node.id)) {
				const values = getValues();
				queueMicrotask(() => {
					if (!mountedRef.current) validateOnCloseRef.current?.(values);
				});
				flush();
			} else clearTimeout(timer);
		};
	}, [
		watch,
		trigger,
		getValues,
		getFieldState,
		node.id,
		getNodes,
		getNodeDraft,
	]);

	return (
		<div className="flex flex-col h-full w-full bg-background shadow-sm">
			<div className="sticky top-0 z-10 bg-background">
				<NodeNameSection node={node} />
				<EditorStatusBar
					status={
						configurationIssues.length
							? getNodeDraft()
								? "unsaved"
								: "idle"
							: editorStatus
					}
				/>
			</div>
			<NodeConfigurationIssues
				issues={configurationIssues}
				onSelect={focusIssue}
			/>

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
