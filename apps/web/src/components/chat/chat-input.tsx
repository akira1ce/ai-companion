"use client";

import { ArrowUp } from "lucide-react";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
	value: string;
	onChange: (v: string) => void;
	onSubmit: () => void;
	disabled: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleInput = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange(e.target.value);
			const el = e.target;
			el.style.height = "auto";
			el.style.height = Math.min(el.scrollHeight, 120) + "px";
		},
		[onChange]
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSubmit();
		}
	};

	const hasContent = value.trim().length > 0;

	return (
		<footer className="shrink-0 p-4">
			<div className="flex items-end gap-2">
				<textarea
					ref={textareaRef}
					value={value}
					onChange={handleInput}
					onKeyDown={handleKeyDown}
					placeholder="说点什么吧..."
					rows={1}
					disabled={disabled}
					className="border-chat-input-border focus:border-imessage-blue placeholder:text-chat-muted max-h-[120px] min-h-[36px] flex-1 resize-none overflow-y-auto rounded-[20px] border bg-white px-4 py-2 text-[17px] leading-[22px] transition-all outline-none disabled:opacity-50"
				/>
				<button
					onClick={onSubmit}
					disabled={disabled || !hasContent}
					className={cn(
						"mb-[3px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition-all",
						hasContent && !disabled
							? "bg-imessage-blue hover:bg-imessage-blue-dark text-white"
							: "cursor-not-allowed bg-gray-300 text-white opacity-50"
					)}
				>
					<ArrowUp className="h-4 w-4 stroke-[2.5]" />
				</button>
			</div>
		</footer>
	);
}
