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

export const fetchPublicTemplates = async ({
	pageParam = 1,
}: {
	pageParam?: number;
} = {}): Promise<{ templates: PublicTemplate[]; hasNextPage: boolean }> => {
	const response = await api.get<{
		templates: PublicTemplate[];
		hasNextPage: boolean;
	}>(`/templates/all?page=${pageParam}`);
	return response.data;
};

export const fetchTemplate = async (
	templateId: string,
): Promise<PublicTemplate> => {
	const response = await api.get<{ template: PublicTemplate }>(
		`/templates/${templateId}`,
	);
	return response.data.template;
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
