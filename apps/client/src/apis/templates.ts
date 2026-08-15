import {
	type Template,
	type TemplateData,
	updateTemplateSchema,
} from "@nodebase/shared";
import { z } from "zod";
import api from "./axios";

export type PublicTemplate = Template & {
	id: string;
	nodeCount: number | null;
};

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export const fetchPublicTemplates = async (): Promise<PublicTemplate[]> => {
	const response = await api.get<{ templates: PublicTemplate[] }>(
		"/templates/all",
		{ params: { isActive: true } },
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
