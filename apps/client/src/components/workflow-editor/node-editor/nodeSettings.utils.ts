import { NodeSettingsDefaultValues, type NodeSettings } from "@nodebase/shared";

export function getEditableNodeSettings(task: string, settings: NodeSettings) {
	return task.startsWith("action.")
		? {
				...settings,
				retryCount: settings.retryCount ?? NodeSettingsDefaultValues.retryCount,
				timeout: settings.timeout ?? NodeSettingsDefaultValues.timeout,
			}
		: settings;
}
