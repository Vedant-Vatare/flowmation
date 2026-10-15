import {
	githubTriggerNodeSchema,
	NodeSettingsDefaultValues,
} from "@nodebase/shared";

// The catalog's editable starting values; runtime matching uses the published node.
export const githubTriggerDefinition = githubTriggerNodeSchema.parse({
	name: "GitHub Trigger",
	description: "Start a workflow from signed GitHub repository events.",
	task: "trigger.github",
	type: "trigger",
	settings: NodeSettingsDefaultValues,
	parameters: [
		{
			name: "repository",
			label: "Repository",
			type: "input",
			value: "owner/repository",
			required: true,
		},
		{
			name: "event",
			label: "Event",
			type: "dropdown",
			value: "push",
			required: true,
		},
		{
			name: "actions",
			label: "Actions (optional)",
			type: "array",
			value: [],
			required: false,
		},
		{
			name: "branch",
			label: "Push branch",
			type: "input",
			value: "",
			required: false,
		},
	],
});
