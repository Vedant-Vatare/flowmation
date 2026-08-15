import {
	CheckmarkCircle01Icon,
	Download01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	useGetPublicTemplates,
	useGetTemplateData,
	useUpdateTemplate,
} from "@/queries/templates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateThumbnailCapture } from "@/components/templates/TemplateThumbnailCapture";

const THUMBNAIL_MAX_LENGTH = 2_000_000;

export const ThumbnailTestPage = () => {
	const { data: templates, isLoading: templatesLoading } =
		useGetPublicTemplates();
	const [selectedId, setSelectedId] = useState<string>("");
	const [captureKey, setCaptureKey] = useState(0);
	const [dataUrl, setDataUrl] = useState<string | null>(null);
	const [captureError, setCaptureError] = useState<unknown>(null);

	const { data: templateData, isLoading: dataLoading } =
		useGetTemplateData(selectedId);

	const { mutate: saveThumbnail, isPending: isSaving } = useUpdateTemplate();

	const selected = templates?.find((t) => t.id === selectedId);

	const handleCaptureReady = useCallback((url: string) => {
		setDataUrl(url || null);
		setCaptureError(null);
	}, []);

	const handleCaptureError = useCallback((error: unknown) => {
		setCaptureError(error);
		setDataUrl(null);
	}, []);

	const handleSave = () => {
		if (!selectedId || !dataUrl) return;
		saveThumbnail(
			{ templateId: selectedId, updates: { thumbnail: dataUrl } },
			{
				onSuccess: () => toast.success("Thumbnail saved to template"),
				onError: (error) => toast.error(`Save failed: ${String(error)}`),
			},
		);
	};

	const handleDownload = () => {
		if (!dataUrl) return;
		const link = document.createElement("a");
		link.download = `${selected?.title ?? "template"}-thumbnail.png`;
		link.href = dataUrl;
		link.click();
	};

	const lengthKb = dataUrl ? (dataUrl.length / 1024).toFixed(1) : "0";

	return (
		<div className="min-h-screen bg-background p-6 md:p-10">
			<div className="mx-auto flex max-w-5xl flex-col gap-6">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-bold tracking-tight">
						Thumbnail capture test bench
					</h1>
					<p className="text-sm text-muted-foreground">
						Renders a hidden React Flow from template data, screenshots it via
						html-to-image, and lets you save the result to the template.
					</p>
				</div>

				<Card className="p-5">
					<div className="flex flex-col gap-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="template-select">Template</Label>
								<Select
									value={selectedId}
									onValueChange={(value) => {
										setSelectedId(value);
										setDataUrl(null);
										setCaptureError(null);
										setCaptureKey((k) => k + 1);
									}}
								>
									<SelectTrigger id="template-select">
										<SelectValue placeholder="Pick a template" />
									</SelectTrigger>
									<SelectContent>
										{templatesLoading ? (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												Loading…
											</div>
										) : (
											templates?.map((t) => (
												<SelectItem key={t.id} value={t.id}>
													{t.title}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-end gap-2">
								<Button
									variant="outline"
									onClick={() => {
										setDataUrl(null);
										setCaptureError(null);
										setCaptureKey((k) => k + 1);
									}}
									disabled={!selectedId}
									className="w-full"
								>
									<RefreshCw className="size-4" />
									Regenerate
								</Button>
							</div>
						</div>

						{selectedId && selected && (
							<div className="text-xs text-muted-foreground">
								Node graph:{" "}
								<span className="font-medium text-foreground">
									{templateData?.nodes.length ?? "…"}
								</span>{" "}
								nodes,{" "}
								<span className="font-medium text-foreground">
									{templateData?.connections.length ?? "…"}
								</span>{" "}
								connections
							</div>
						)}
					</div>
				</Card>

				{selectedId ? (
					<>
						{dataLoading ? (
							<Card className="p-5">
								<Skeleton className="aspect-video w-full rounded-lg" />
							</Card>
						) : templateData ? (
							<>
								<TemplateThumbnailCapture
									key={captureKey}
									nodes={templateData.nodes}
									connections={templateData.connections}
									onReady={handleCaptureReady}
									onError={handleCaptureError}
								/>

								<Card className="overflow-hidden">
									{captureError ? (
										<div className="flex flex-col gap-2 p-6 text-center">
											<p className="text-sm font-medium text-destructive">
												Capture failed
											</p>
											<p className="text-xs text-muted-foreground break-all">
												{String(captureError)}
											</p>
										</div>
									) : dataUrl ? (
										<>
											<div className="border-b bg-muted/40">
												<img
													src={dataUrl}
													alt="Generated thumbnail"
													className="mx-auto aspect-video w-full max-w-3xl object-contain"
												/>
											</div>
											<div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
												<div className="flex flex-col gap-1 text-xs text-muted-foreground">
													<span>
														Size:{" "}
														<span className="font-medium text-foreground">
															{lengthKb} KB
														</span>{" "}
														of {THUMBNAIL_MAX_LENGTH / 1_000_000} MB cap (
														{(
															(dataUrl.length / THUMBNAIL_MAX_LENGTH) *
															100
														).toFixed(1)}
														%)
													</span>
													<span>
														Rendered at 1280×720 @2x (2560×1440 export)
													</span>
												</div>
												<div className="flex gap-2 sm:ml-auto">
													<Button
														variant="outline"
														size="sm"
														onClick={handleDownload}
													>
														<HugeiconsIcon
															icon={Download01Icon}
															className="size-4"
														/>
														Download PNG
													</Button>
													<Button
														size="sm"
														onClick={handleSave}
														disabled={isSaving}
													>
														{isSaving ? (
															<HugeiconsIcon
																icon={CheckmarkCircle01Icon}
																className="size-4"
															/>
														) : (
															<Camera className="size-4" />
														)}
														Save thumbnail to template
													</Button>
												</div>
											</div>
										</>
									) : (
										<div className="flex flex-col gap-2 p-6 text-center">
											<p className="text-sm font-medium text-muted-foreground">
												Generating…
											</p>
										</div>
									)}
								</Card>
							</>
						) : (
							<Card className="p-6 text-center">
								<p className="text-sm text-muted-foreground">
									This template has no saved node graph.
								</p>
							</Card>
						)}
					</>
				) : (
					<Card className="p-6 text-center">
						<Trash2 className="mx-auto mb-2 size-6 text-muted-foreground/60" />
						<p className="text-sm text-muted-foreground">
							Pick a template to generate its thumbnail.
						</p>
					</Card>
				)}
			</div>
		</div>
	);
};
