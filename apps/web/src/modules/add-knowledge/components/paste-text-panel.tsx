import { type ChangeEvent, type JSX, useCallback, useState } from "react";

const PasteTextPanel = (): JSX.Element => {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");

	const handleTitleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setTitle(event.target.value);
		},
		[],
	);

	const handleContentChange = useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>): void => {
			setContent(event.target.value);
		},
		[],
	);

	return (
		<div className="flex flex-col gap-3.5">
			<div>
				<label
					className="mb-1.5 block text-xs font-medium text-text-muted"
					htmlFor="paste-text-title"
				>
					Title
				</label>
				<input
					className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none
focus:border-accent
focus:ring-2 focus:ring-accent/15"
					id="paste-text-title"
					onChange={handleTitleChange}
					placeholder="e.g. Onboarding notes"
					type="text"
					value={title}
				/>
			</div>

			<div>
				<label
					className="mb-1.5 block text-xs font-medium text-text-muted"
					htmlFor="paste-text-content"
				>
					Content
				</label>
				<textarea
					className="min-h-[160px] w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm leading-
relaxed text-
text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
					id="paste-text-content"
					onChange={handleContentChange}
					placeholder="Paste or type the knowledge you want Prism to learn…"
					value={content}
				/>
			</div>
		</div>
	);
};

export { PasteTextPanel };
