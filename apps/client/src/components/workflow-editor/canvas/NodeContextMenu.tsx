import {
	ClipboardPaste,
	Copy,
	Files,
	Maximize,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NodeContextMenuProps = {
	position: { x: number; y: number };
	nodeName?: string;
	addingNode: boolean;
	onClose: () => void;
	onEdit?: () => void;
	onCopy?: () => void;
	onDuplicate?: () => void;
	onPaste?: () => void;
	onAdd?: () => void;
	onFit?: () => void;
	deleteLabel?: string;
	addLabel?: string;
	onDelete?: () => void;
};

export const NodeContextMenu = ({
	position,
	nodeName,
	addingNode,
	onClose,
	onEdit,
	onCopy,
	onDuplicate,
	onPaste,
	onAdd,
	onFit,
	deleteLabel = "Delete node",
	addLabel = "Add node here",
	onDelete,
}: NodeContextMenuProps) => {
	return (
		<DropdownMenu
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DropdownMenuTrigger asChild>
				<span
					aria-hidden="true"
					className="pointer-events-none fixed size-px"
					style={{ left: position.x, top: position.y }}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				sideOffset={0}
				className="w-48"
				onCloseAutoFocus={(event) => event.preventDefault()}
			>
				{onEdit && (
					<>
						<DropdownMenuLabel className="truncate text-xs text-muted-foreground">
							{nodeName}
						</DropdownMenuLabel>
						<DropdownMenuItem onSelect={onEdit}>
							<Pencil />
							Edit node
						</DropdownMenuItem>
						<DropdownMenuItem disabled={!onCopy} onSelect={onCopy}>
							<Copy />
							Copy node
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!onDuplicate || addingNode}
							onSelect={onDuplicate}
						>
							<Files />
							Duplicate node
						</DropdownMenuItem>
					</>
				)}
				{onAdd && (
					<DropdownMenuItem onSelect={onAdd}>
						<Plus />
						{addLabel}
					</DropdownMenuItem>
				)}
				{onPaste && (
					<DropdownMenuItem disabled={addingNode} onSelect={onPaste}>
						<ClipboardPaste />
						Paste node
					</DropdownMenuItem>
				)}
				{onFit && (
					<DropdownMenuItem onSelect={onFit}>
						<Maximize />
						Fit to view
					</DropdownMenuItem>
				)}
				{onDelete && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onSelect={onDelete}>
							<Trash2 />
							{deleteLabel}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
