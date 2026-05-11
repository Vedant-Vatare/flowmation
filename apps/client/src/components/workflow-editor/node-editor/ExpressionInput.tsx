/* biome-ignore-all lint/suspicious/noArrayIndexKey : ignore index */
import { useNodes } from "@xyflow/react";
import {
	type ChangeEvent,
	type KeyboardEvent,
	useCallback,
	useRef,
	useState,
} from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
import type { WorkflowNodeData } from "@/constants/nodes";

interface ExpressionInputProps {
	value: string;
	onChange: (value: string) => void;
	currentNodeId: string;
	multiline?: boolean;
	placeholder?: string;
	className?: string;
	id?: string;
}

function tokenize(text: string): { text: string; isExpr: boolean }[] {
	const parts: { text: string; isExpr: boolean }[] = [];
	const regex = /(\{\{[^}]*\}\})/g;
	let last = 0;
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
	while ((match = regex.exec(text)) !== null) {
		if (match.index > last) {
			parts.push({ text: text.slice(last, match.index), isExpr: false });
		}
		parts.push({ text: match[0], isExpr: true });
		last = regex.lastIndex;
	}
	if (last < text.length) {
		parts.push({ text: text.slice(last), isExpr: false });
	}
	return parts;
}

function getActiveExpression(value: string, cursorPos: number): string | null {
	const textBeforeCursor = value.slice(0, cursorPos);
	const openIdx = textBeforeCursor.lastIndexOf("{{");
	if (openIdx === -1) return null;

	const between = textBeforeCursor.slice(openIdx + 2);
	if (between.includes("}}")) return null;

	return between;
}

export const ExpressionInput = ({
	value,
	onChange,
	currentNodeId,
	multiline = false,
	placeholder,
	className = "",
	id,
}: ExpressionInputProps) => {
	const allNodes = useNodes();
	const otherNodes = allNodes.filter((n) => n.id !== currentNodeId);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
	const highlightRef = useRef<HTMLDivElement>(null);

	const suggestions = otherNodes.filter((n) =>
		(n.data as WorkflowNodeData).name
			.toLowerCase()
			.includes(filter.toLowerCase()),
	);

	const syncScroll = useCallback(() => {
		if (!highlightRef.current || !inputRef.current) return;
		highlightRef.current.scrollTop = inputRef.current.scrollTop;
		highlightRef.current.scrollLeft = inputRef.current.scrollLeft;
	}, []);

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const newValue = e.target.value;
		const cursor = e.target.selectionStart ?? newValue.length;

		onChange(newValue);

		const active = getActiveExpression(newValue, cursor);
		if (active !== null) {
			setFilter(active);
			setDropdownOpen(true);
		} else {
			setDropdownOpen(false);
		}
	};

	const handlePaste = (
		_e: React.ClipboardEvent<HTMLInputElement & HTMLTextAreaElement>,
	) => {
		requestAnimationFrame(() => {
			const el = inputRef.current;
			if (!el) return;
			const newValue = el.value;
			onChange(newValue);

			const cursor = el.selectionStart ?? newValue.length;
			const active = getActiveExpression(newValue, cursor);
			if (active !== null) {
				setFilter(active);
				setDropdownOpen(true);
			} else {
				setDropdownOpen(false);
			}
		});
	};

	const insertNode = useCallback(
		(nodeName: string) => {
			const el = inputRef.current;
			if (!el) return;

			const cursor = el.selectionStart ?? value.length;
			const textBeforeCursor = value.slice(0, cursor);
			const openIdx = textBeforeCursor.lastIndexOf("{{");

			const before = value.slice(0, openIdx);
			const after = value.slice(cursor);
			const newValue = `${before}{{${nodeName}}}${after}`;

			onChange(newValue);
			setDropdownOpen(false);

			const newCursor = openIdx + nodeName.length + 4;
			requestAnimationFrame(() => {
				el.setSelectionRange(newCursor, newCursor);
				el.focus();
			});
		},
		[value, onChange],
	);
	const commandRef = useRef<HTMLDivElement>(null);

	const handleKeyDown = (
		e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (!dropdownOpen) return;

		if (e.key === "Escape") {
			setDropdownOpen(false);
		} else if (e.key === "Tab") {
			e.preventDefault();
			const highlighted =
				suggestions.find((n) => (n.data as WorkflowNodeData).name === filter) ??
				suggestions[0];
			if (highlighted) insertNode((highlighted.data as WorkflowNodeData).name);
		} else if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
			e.preventDefault();
			commandRef.current?.dispatchEvent(
				new KeyboardEvent("keydown", { key: e.key, bubbles: true }),
			);
		}
	};

	const renderHighlight = () =>
		tokenize(value).map((token, i) =>
			token.isExpr ? (
				<div key={i} className="rounded-sm bg-[#5e69d2]/40 max-w-max px-px">
					{token.text}
				</div>
			) : (
				<span key={i}>{token.text}</span>
			),
		);

	const sharedStyle: React.CSSProperties = {
		fontFamily: "inherit",
		fontSize: "0.875rem",
		lineHeight: "1.5",
		letterSpacing: "inherit",
		padding: "0.375rem 0.75rem",
		margin: 0,
		border: "none",
		outline: "none",
		whiteSpace: multiline ? "pre-wrap" : "pre",
		wordWrap: multiline ? "break-word" : undefined,
		overflowWrap: multiline ? "break-word" : undefined,
		tabSize: 2,
	};

	const Comp = multiline ? "textarea" : "input";

	return (
		<Popover open={dropdownOpen}>
			<div className="relative w-full">
				<div
					ref={highlightRef}
					aria-hidden
					style={{
						...sharedStyle,
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						overflow: "hidden",
						color: "transparent",
						zIndex: 0,
						borderRadius: "calc(var(--radius) - 2px)",
					}}
				>
					{renderHighlight()}{" "}
				</div>
				<PopoverAnchor asChild>
					<Comp
						ref={inputRef as never}
						id={id}
						value={value}
						placeholder={placeholder}
						onChange={handleChange}
						onPaste={handlePaste}
						onKeyDown={handleKeyDown}
						onScroll={syncScroll}
						spellCheck={false}
						rows={multiline ? 3 : undefined}
						style={{
							...sharedStyle,
							position: "relative",
							zIndex: 1,
							background: "transparent",
							color: "inherit",
							caretColor: "var(--foreground)",
							resize: multiline ? "vertical" : undefined,
						}}
						className={[
							"w-full rounded-md border border-input shadow-sm",
							"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
							"placeholder:text-muted-foreground",
							"disabled:cursor-not-allowed disabled:opacity-50",
							className,
						].join(" ")}
					/>
				</PopoverAnchor>

				<PopoverContent
					className="p-0 min-w-64 w-(--radix-popover-trigger-width)"
					align="start"
					onOpenAutoFocus={(e) => e.preventDefault()}
					onInteractOutside={() => setDropdownOpen(false)}
				>
					<Command ref={commandRef}>
						<CommandList>
							<CommandGroup heading="Workflow nodes">
								<CommandEmpty>No nodes found.</CommandEmpty>
								{suggestions.map((node) => {
									const name = (node.data as WorkflowNodeData).name;
									return (
										<CommandItem
											key={node.id}
											value={name}
											onMouseDown={(e) => e.preventDefault()}
											onSelect={() => insertNode(name)}
											className="flex items-center gap-2 cursor-pointer"
										>
											<span
												className="text-[10px] font-mono px-1 py-0.5 rounded shrink-0"
												style={{
													background: "rgba(128, 67, 220, 0.15)",
													color: "#a855f7",
												}}
											>
												{"{{"}
											</span>
											<span className="capitalize">{name}</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</div>
		</Popover>
	);
};
