import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	fetchPublicTemplates,
	fetchTemplate,
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
	queryFn: ({ pageParam }: { pageParam: number }) =>
		fetchPublicTemplates({ pageParam }),
	initialPageParam: 1,
	getNextPageParam: (
		lastPage: { hasNextPage: boolean },
		allPages: unknown[],
	) => (lastPage.hasNextPage ? allPages.length + 1 : undefined),
	staleTime: 60_000,
});

export const useGetPublicTemplates = () =>
	useInfiniteQuery(publicTemplatesOptions());

export const useGetTemplate = (templateId: string) =>
	useQuery({
		queryKey: TEMPLATES_QUERY_KEYS.detail(templateId),
		queryFn: () => fetchTemplate(templateId),
		enabled: Boolean(templateId),
	});

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
