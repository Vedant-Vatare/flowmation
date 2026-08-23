import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	fetchPublicTemplates,
	fetchTemplateData,
	type UpdateTemplateInput,
	updateTemplate,
} from "../apis/templates";

export const TEMPLATES_QUERY_KEYS = {
	public: ["templates", "public"] as const,
	detail: (id: string) => ["templates", "detail", id] as const,
	data: (id: string) => ["templates", "data", id] as const,
};

export const publicTemplatesOptions = () => ({
	queryKey: TEMPLATES_QUERY_KEYS.public,
	queryFn: fetchPublicTemplates,
	staleTime: 60_000,
});

export const useGetPublicTemplates = () => useQuery(publicTemplatesOptions());

export const useGetTemplate = (templateId: string) => {
	const query = useGetPublicTemplates();
	const data = useMemo(
		() => query.data?.find((t) => t.id === templateId) ?? null,
		[query.data, templateId],
	);
	return {
		...query,
		data,
		isLoading: query.isLoading,
		isError: query.isError,
	};
};

export const templateDataOptions = (templateId: string) => ({
	queryKey: TEMPLATES_QUERY_KEYS.data(templateId),
	queryFn: () => fetchTemplateData(templateId),
	enabled: Boolean(templateId),
});

export const useGetTemplateData = (templateId: string) =>
	useQuery(templateDataOptions(templateId));

export const useUpdateTemplate = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			templateId,
			updates,
		}: {
			templateId: string;
			updates: UpdateTemplateInput;
		}) => updateTemplate(templateId, updates),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEYS.public });
			queryClient.invalidateQueries({
				queryKey: TEMPLATES_QUERY_KEYS.detail(variables.templateId),
			});
			queryClient.invalidateQueries({
				queryKey: TEMPLATES_QUERY_KEYS.data(variables.templateId),
			});
		},
	});
};
