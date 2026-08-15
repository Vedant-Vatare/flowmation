import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	fetchPublicTemplates,
	fetchTemplateData,
	updateTemplate,
	type UpdateTemplateInput,
} from "../apis/templates";

export const publicTemplatesOptions = () => ({
	queryKey: ["templates", "public"],
	queryFn: fetchPublicTemplates,
	staleTime: 60_000,
});

export const useGetPublicTemplates = () => useQuery(publicTemplatesOptions());

export const useGetTemplate = (templateId: string) => {
	const { data: templates } = useGetPublicTemplates();

	return useQuery({
		queryKey: ["templates", "detail", templateId],
		queryFn: () => {
			const template = templates?.find((t) => t.id === templateId);
			return template ?? null;
		},
		enabled: Boolean(templateId) && Boolean(templates),
	});
};

export const templateDataOptions = (templateId: string) => ({
	queryKey: ["templates", "data", templateId],
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
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["templates", "public"],
			});
		},
	});
};
