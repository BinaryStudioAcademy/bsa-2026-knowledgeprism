import {
	type Block,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
	type PartialBlock,
} from "@blocknote/core";
import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import {
	type JSX,
	type ReactNode,
	type SyntheticEvent,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import { useController, useWatch } from "react-hook-form";

import {
	Input,
	KnowledgeEditor,
	type KnowledgeEditorApi,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";
import { useAppForm } from "~/hooks/hooks.js";
import { GlossarySuggestionActions } from "~/modules/glossary/components/glossary-suggestions/glossary-suggestion-actions.js";
import { GlossarySuggestions } from "~/modules/glossary/components/glossary-suggestions/glossary-suggestions.js";
import {
	toGlossaryHighlightId,
	toGlossaryHighlights,
} from "~/modules/glossary/libs/helpers/helpers.js";
import {
	type KbEntry,
	type KnowledgeEntryUpdateRequestDto,
} from "~/modules/knowledge/libs/types/types.js";

import { useGlossaryEditorWarnings } from "./hooks/use-glossary-editor-warnings.hook.js";
import { kbEntryValidationSchema } from "./validation-schema.js";

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

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

const extractInlineText = (item: unknown): string => {
	if (!item) {
		return "";
	}

	if (typeof item === "string") {
		return item;
	}

	if (isTextNode(item)) {
		return item.text;
	}

	if (typeof item === "object") {
		const candidate = item as { content?: unknown; text?: unknown };

		if (typeof candidate.text === "string") {
			return candidate.text;
		}

		if (candidate.content) {
			return extractPlainText(candidate.content);
		}
	}

	return "";
};

const extractBlockContent = (candidate: {
	cells?: unknown;
	content?: unknown;
	props?: unknown;
	rows?: unknown;
}): string => {
	if (Array.isArray(candidate.content)) {
		return candidate.content
			.map((item: unknown) => extractInlineText(item))
			.join("");
	}

	if (typeof candidate.content === "string") {
		return candidate.content;
	}

	if (candidate.content && typeof candidate.content === "object") {
		return extractPlainText(candidate.content);
	}

	if (candidate.rows) {
		return extractPlainText(candidate.rows);
	}

	if (candidate.cells) {
		return extractPlainText(candidate.cells);
	}

	if (candidate.props && typeof candidate.props === "object") {
		const properties = candidate.props as Record<string, unknown>;

		if (typeof properties["url"] === "string") {
			return properties["url"].trim();
		}
	}

	return "";
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

	if (Array.isArray(content)) {
		return content
			.map((item: unknown) => extractPlainText(item))
			.filter(Boolean)
			.join(" ");
	}

	if (typeof content === "object") {
		const candidate = content as {
			cells?: unknown;
			children?: unknown;
			content?: unknown;
			props?: unknown;
			rows?: unknown;
			text?: unknown;
		};

		if (typeof candidate.text === "string") {
			return candidate.text;
		}

		const text = extractBlockContent(candidate);
		const nested = candidate.children
			? extractPlainText(candidate.children)
			: "";

		return `${text} ${nested}`.trim();
	}

	return "";
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

type GlossaryWarningTooltipContentProperties = {
	match: GlossaryConsistencyMatchDto;
	onKeep: (match: GlossaryConsistencyMatchDto) => void;
	onReplace: (replacement: string) => void;
};

const GlossaryWarningTooltipContent = ({
	match,
	onKeep,
	onReplace,
}: GlossaryWarningTooltipContentProperties): JSX.Element => {
	const handleAccept = useCallback(
		(acceptedMatch: GlossaryConsistencyMatchDto): void => {
			onReplace(acceptedMatch.suggestedText);
		},
		[onReplace],
	);

	return (
		<div className="flex flex-col gap-1.5">
			<Paragraph className="text-xs text-text" size={ParagraphSize.BODY_SMALL}>
				Glossary term:{" "}
				<span className="font-medium">{match.canonicalName}</span>
			</Paragraph>
			<Paragraph
				className="text-2xs text-text-faint"
				size={ParagraphSize.BODY_SMALL}
			>
				{match.explanation}
			</Paragraph>
			<GlossarySuggestionActions
				match={match}
				onAccept={handleAccept}
				onKeep={onKeep}
			/>
		</div>
	);
};

interface KbEntryFormProperties {
	entry: KbEntry;
	onCancel: () => void;
	onSave: (payload: KnowledgeEntryUpdateRequestDto) => Promise<boolean>;
}

const KbEntryForm = ({ entry, onCancel, onSave }: KbEntryFormProperties) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isMaxTitleReached, setIsMaxTitleReached] = useState(false);
	const editorApiReference = useRef<KnowledgeEditorApi | null>(null);

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
		(blocks: EditorBlock[]): void => {
			contentField.onChange(blocks);
		},
		[contentField],
	);

	const handleEditorReady = useCallback((api: KnowledgeEditorApi): void => {
		editorApiReference.current = api;
	}, []);

	const editorBlocks = useMemo(
		() => currentContentJson as unknown as EditorBlock[],
		[currentContentJson],
	);

	const {
		dismiss: dismissGlossaryWarning,
		isChecking: isCheckingGlossaryWarnings,
		matches: glossaryWarningMatches,
	} = useGlossaryEditorWarnings({ blocks: editorBlocks });

	const glossaryHighlights = useMemo(
		() =>
			toGlossaryHighlights(
				glossaryWarningMatches,
				TextHighlightVariant.WARNING,
			),
		[glossaryWarningMatches],
	);

	const glossaryMatchesById = useMemo(
		() =>
			new Map(
				glossaryWarningMatches.map((match) => [
					toGlossaryHighlightId(match),
					match,
				]),
			),
		[glossaryWarningMatches],
	);

	const handleKeepGlossaryWarning = useCallback(
		(match: GlossaryConsistencyMatchDto): void => {
			dismissGlossaryWarning(toGlossaryHighlightId(match));
		},
		[dismissGlossaryWarning],
	);

	// The panel list sits outside the hover tooltip, so its Accept can't use the tooltip's own
	// `replace` action — it goes through the editor api lifted via `onReady` instead. Both
	// paths end up calling the same extension method, so the form's onChange records either.
	const handleAcceptGlossaryWarningFromList = useCallback(
		(match: GlossaryConsistencyMatchDto): void => {
			editorApiReference.current?.replace(
				toGlossaryHighlightId(match),
				match.suggestedText,
			);
		},
		[],
	);

	const renderGlossaryWarningTooltip = useCallback(
		(
			highlightId: string,
			tooltipActions: { replace: (replacement: string) => void },
		): ReactNode => {
			const match = glossaryMatchesById.get(highlightId);

			if (!match) {
				return null;
			}

			return (
				<GlossaryWarningTooltipContent
					match={match}
					onKeep={handleKeepGlossaryWarning}
					onReplace={tooltipActions.replace}
				/>
			);
		},
		[glossaryMatchesById, handleKeepGlossaryWarning],
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

	const isContentEmpty = isBlockNoteEmpty(currentContentJson);

	return (
		<form
			className="flex flex-col gap-4"
			id="kb-entry-form"
			onSubmit={handleFormSubmit}
		>
			<div className="kb-body flex flex-col gap-4">
				<div className="flex flex-col gap-1" onInput={handleTitleInput}>
					<Input
						control={control}
						disabled={isSubmitting}
						label="Title"
						name="title"
						placeholder="Enter title..."
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
							highlights={glossaryHighlights}
							initialContent={initialContent}
							isEditable={!isSubmitting}
							onChange={handleEditorChange}
							onReady={handleEditorReady}
							renderHighlightTooltip={renderGlossaryWarningTooltip}
						/>
					</div>
					{(contentError || isContentEmpty) && (
						<span className="font-sans text-xs text-error">
							{contentError?.message || "Description cannot be empty"}
						</span>
					)}

					<GlossarySuggestions
						isChecking={isCheckingGlossaryWarnings}
						matches={glossaryWarningMatches}
						onAccept={handleAcceptGlossaryWarningFromList}
						onKeep={handleKeepGlossaryWarning}
						variant={TextHighlightVariant.WARNING}
					/>
				</div>
			</div>
		</form>
	);
};

export { KbEntryForm };
