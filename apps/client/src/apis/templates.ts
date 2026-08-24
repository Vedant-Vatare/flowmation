import type {
	Template,
	TemplateData,
	updateTemplateSchema,
} from "@nodebase/shared";
import type { z } from "zod";
import api from "./axios";

export type PublicTemplate = Omit<Template, "createdAt" | "updatedAt"> & {
	id: string;
	nodeCount: number | null;
	triggerType: "webhook" | "schedule" | "manual" | "input_trigger" | null;
	integrationsUsed: string[];
	difficulty: string | null;
	createdAt: string;
	updatedAt: string;
};

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export const fetchPublicTemplates = async (): Promise<PublicTemplate[]> => {
	const response = await api.get<{ templates: PublicTemplate[] }>(
		"/templates/all",
	);
	return response.data.templates;
};

export const fetchTemplateData = async (
	templateId: string,
): Promise<TemplateData> => {
	const response = await api.get<{ data: TemplateData }>(
		`/templates/${templateId}/data`,
	);
	return response.data.data;
};

export const updateTemplate = async (
	templateId: string,
	updates: UpdateTemplateInput,
): Promise<Template> => {
	const response = await api.patch<{ template: Template }>(
		`/templates/${templateId}`,
		updates,
	);
	return response.data.template;
};
