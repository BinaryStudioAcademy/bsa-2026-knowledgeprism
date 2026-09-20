import { type PartialBlock } from "@blocknote/core";
import { type SyntheticEvent, useCallback, useMemo, useState } from "react";
import { useController, useFormState, useWatch } from "react-hook-form";

import { Button, Input, KnowledgeEditor } from "~/components/components.js";
import { useAppForm } from "~/hooks/hooks.js";
import {
	type KbEntry,
	type KnowledgeEntryUpdateRequestDto,
} from "~/modules/knowledge/libs/types/types.js";

import { kbEntryValidationSchema } from "./validation-schema.js";

const EMPTY_COUNT = 0;
const MAX_TITLE_CHARACTERS = 255;

const DEFAULT_BLOCKS: PartialBlock[] = [
	{
		type: "paragraph",
	},
];

type TextNode = {
	text: string;
};

const isTextNode = (item: unknown): item is TextNode => {
	return typeof (item as Record<string, unknown>)["text"] === "string";
};

const extractPlainText = (content: unknown): string => {
	if (!content) {
		return "";
	}

	if (typeof content === "string") {
		const trimmed = content.trim();
		if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
			return trimmed;
		}

		try {
			const parsed: unknown = JSON.parse(trimmed);
			return extractPlainText(parsed);
		} catch {
			return trimmed;
		}
	}

	if (!Array.isArray(content)) {
		return "";
	}

	return content
		.map((block: unknown) => {
			if (typeof block !== "object" || block === null) {
				return "";
			}

			const candidate = block as {
				children?: unknown;
				content?: unknown;
			};

			let text = "";

			if (Array.isArray(candidate.content)) {
				text = candidate.content
					.map((item: unknown) => {
						if (typeof item === "string") {
							return item;
						}
						if (isTextNode(item)) {
							return item.text;
						}
						return "";
					})
					.join("");
			} else if (typeof candidate.content === "string") {
				text = candidate.content;
			}

			const nested = Array.isArray(candidate.children)
				? extractPlainText(candidate.children)
				: "";

			return `${text} ${nested}`.trim();
		})
		.filter(Boolean)
		.join(" ");
};

const isBlockNoteEmpty = (document: unknown): boolean => {
	return extractPlainText(document).trim().length === EMPTY_COUNT;
};

const isBlockArray = (value: unknown): value is PartialBlock[] => {
	return Array.isArray(value);
};

const parseInitialContent = (content?: unknown): PartialBlock[] => {
	if (!content) {
		return DEFAULT_BLOCKS;
	}
	if (isBlockArray(content)) {
		return content.length > EMPTY_COUNT ? content : DEFAULT_BLOCKS;
	}
	return DEFAULT_BLOCKS;
};

interface KbEntryFormProperties {
	entry: KbEntry;
	onCancel: () => void;
	onSave: (payload: KnowledgeEntryUpdateRequestDto) => Promise<boolean>;
	saveErrorMessage: null | string;
}

const KbEntryForm = ({
	entry,
	onCancel,
	onSave,
	saveErrorMessage,
}: KbEntryFormProperties) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isMaxTitleReached, setIsMaxTitleReached] = useState(false);

	const initialContent = useMemo(
		() => parseInitialContent(entry.contentJson),
		[entry.contentJson],
	);

	const initialBlocks = useMemo(
		() => initialContent as unknown as Record<string, unknown>[],
		[initialContent],
	);

	const { control, handleSubmit } = useAppForm<KnowledgeEntryUpdateRequestDto>({
		defaultValues: {
			contentJson: initialBlocks,
			title: entry.title,
		},
		mode: "onChange",
		validationSchema: kbEntryValidationSchema,
	});

	const { errors } = useFormState({ control });
	const currentTitle = useWatch({ control, name: "title" });
	const currentContentJson = useWatch({ control, name: "contentJson" });

	const {
		field: titleField,
		fieldState: { error: titleError },
	} = useController({ control, name: "title" });

	const {
		field: contentField,
		fieldState: { error: contentError },
	} = useController({ control, name: "contentJson" });

	const handleEditorChange = useCallback(
		(blocks: unknown): void => {
			contentField.onChange(blocks);
		},
		[contentField],
	);

	const handleValidSubmit = useCallback(
		async (values: KnowledgeEntryUpdateRequestDto): Promise<void> => {
			try {
				setIsSubmitting(true);
				const isSuccess = await onSave(values);

				if (isSuccess) {
					onCancel();
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[onCancel, onSave],
	);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			event_.preventDefault();
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	const handleTitleInput = useCallback(
		(event: SyntheticEvent): void => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) {
				return;
			}

			if (target.value.length >= MAX_TITLE_CHARACTERS) {
				setIsMaxTitleReached(true);
				if (target.value.length > MAX_TITLE_CHARACTERS) {
					const truncated = target.value.slice(
						EMPTY_COUNT,
						MAX_TITLE_CHARACTERS,
					);
					target.value = truncated;
					titleField.onChange(truncated);
				}
			} else {
				setIsMaxTitleReached(false);
			}
		},
		[titleField],
	);

	const isTitleEmpty = currentTitle.trim().length === EMPTY_COUNT;
	const isContentEmpty = isBlockNoteEmpty(currentContentJson);

	const hasFormErrors = Boolean(
		titleError || contentError || errors.title || errors.contentJson,
	);

	const isSaveDisabled =
		isSubmitting || isTitleEmpty || isContentEmpty || hasFormErrors;

	return (
		<form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
			<div className="kb-header flex justify-end gap-2 pb-4">
				<Button
					disabled={isSubmitting}
					onClick={onCancel}
					type="button"
					variant="ghost"
				>
					Cancel
				</Button>
				<Button disabled={isSaveDisabled} type="submit">
					Save
				</Button>
			</div>

			{saveErrorMessage && (
				<div className="rounded-md border border-error bg-error-bg p-3 text-sm text-error shadow-sm">
					{saveErrorMessage}
				</div>
			)}

			<div className="kb-body flex flex-col gap-4">
				<div className="flex flex-col gap-1" onInput={handleTitleInput}>
					<Input
						control={control}
						disabled={isSubmitting}
						label="Event or club name"
						name="title"
						placeholder="Enter name..."
					/>
					{isMaxTitleReached && !titleError && (
						<span className="font-sans text-xs text-warning">
							Maximum length of 255 characters reached
						</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<span
						className={`font-sans text-sm font-medium ${
							contentError || isContentEmpty ? "text-error" : "text-text"
						}`}
					>
						Description
					</span>
					<div
						className={`min-h-64 rounded-md border p-2 shadow-sm transition-colors ${
							contentError || isContentEmpty ? "border-error" : "border-border"
						}`}
					>
						<KnowledgeEditor
							initialContent={initialContent}
							isEditable={!isSubmitting}
							onChange={handleEditorChange}
						/>
					</div>
					{(contentError || isContentEmpty) && (
						<span className="font-sans text-xs text-error">
							{contentError?.message || "Description cannot be empty"}
						</span>
					)}
				</div>
			</div>
		</form>
	);
};

export { KbEntryForm };
