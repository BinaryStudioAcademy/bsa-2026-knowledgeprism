import {
	type Block,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
	type PartialBlock,
} from "@blocknote/core";
import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import {
	type ChangeEvent,
	type JSX,
	type KeyboardEvent,
	type MouseEvent,
	type ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	Alert,
	Button,
	Heading,
	Icon,
	KnowledgeEditor,
	Modal,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";
import { type TextHighlight } from "~/components/knowledge-editor/libs/types/types.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { GlossarySuggestionActions } from "~/modules/glossary/components/glossary-suggestions/glossary-suggestion-actions.js";
import { GlossarySuggestions } from "~/modules/glossary/components/glossary-suggestions/glossary-suggestions.js";
import {
	toGlossaryHighlightId,
	toGlossaryHighlights,
} from "~/modules/glossary/libs/helpers/helpers.js";
import {
	isManualPage,
	movePageGroup,
	moveSectionAcrossPages,
	rejectActiveSection,
	removePageGroup,
	removeSectionFromPages,
	toConflictResolutions,
	toContentOverrides,
	updatePageInPages,
	updateSectionInPages,
} from "~/modules/knowledge/libs/helpers/helpers.js";
import { mergePlacementIntoPages } from "~/modules/knowledge/libs/helpers/merge-placement-into-pages.helper.js";
import { toPublishedItems } from "~/modules/knowledge/libs/helpers/to-published-items.helper.js";
import { toPublishedPlacements } from "~/modules/knowledge/libs/helpers/to-published-placements.helper.js";
import {
	type ActiveNodeType,
	type FieldConflict,
	type IntegrationPreviewProperties,
	type PlacementTarget,
	type ProposedPage,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

import { MergeScreen } from "./libs/components/merge-screen.js";
import { ProposedStructureSuccessModal } from "./libs/components/proposed-structure-success-modal.js";
import {
	SectionNavigator,
	toSectionPositions,
} from "./libs/components/section-navigator.js";
import { DOCUMENT_PAGE_LABEL } from "./libs/components/section-row-menu.js";
import {
	formatChangeStatusLabel,
	StructureAside,
} from "./libs/components/structure-aside.js";
import { DEFAULT_PAGE_INDEX, DEFAULT_SECTION_INDEX } from "./libs/constants.js";
import { replaceTextInBlocks } from "./libs/helpers/replace-text-in-blocks.helper.js";
import {
	hasSavedResolutions,
	withSavedResolutions,
} from "./libs/helpers/saved-conflict-resolutions.helper.js";
import { toFailedPagesMessage } from "./libs/helpers/to-failed-pages-message.helper.js";
import { useGlossaryConsistencyCheck } from "./libs/hooks/use-glossary-consistency-check.hook.js";

const IS_EXTRACTION_VALIDATION = true;

const UNDER_PLACE_PREFIX = "Under ";
const NO_PLACEMENT_TARGETS: PlacementTarget[] = [];
const BLANK_REVIEW_MESSAGE =
	"Every page and item needs a title and content before you can approve. Fill in or remove the blank ones.";
const EMPTY_LENGTH = 0;
const FINISH_WITHOUT_PUBLISHING_LABEL = "Finish without publishing";
const FIRST_MATCH_INDEX = 0;
const LAST_INDEX_OFFSET = 1;
const LIVE_KB_CONTENT_FALLBACK = "No live knowledge base content.";
const PUBLISH_LABEL = "Approve & save";
const ICON_SIZE_MEDIUM = 16;
const NOT_FOUND_INDEX = -1;
const TITLE_MAX_LENGTH = 255;
const EDIT_HINT = "Esc to exit · Alt+↓ next";
const NEXT_SECTION_STEP = 1;
const PREVIOUS_SECTION_STEP = -1;

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

type PreviewFooterProperties = {
	approveLabel: string;
	canEdit: boolean;
	canSubmitReview: boolean;
	isApplying: boolean;
	isEditInvalid: boolean;
	isEditMode: boolean;
	onApprove: () => void;
	onCancelDocument?: (() => void) | undefined;
	onCancelEdit: () => void;
	onClose: () => void;
	onEnterEdit: () => void;
	onSaveEdit: () => void;
	submitBlockedReason?: string | undefined;
};

type ProposedNodeType = ProposedPage["type"] | ProposedSection["type"];

type SectionContentEditorProperties = {
	blocks?: PartialBlock[];
	content: string;
	highlights?: TextHighlight[];
	isEditable?: boolean;
	onContentChange?: (content: string, blocks: PartialBlock[]) => void;
	renderHighlightTooltip?: (
		highlightId: string,
		actions: { replace: (replacement: string) => void },
	) => ReactNode;
};

type SectionDetailsProperties = {
	activeNodeType: ActiveNodeType;
	activePage: ProposedSection | undefined;
	activeSection: ProposedPage | undefined;
	isContentEmpty: boolean;
	isEditMode: boolean;
	isInteractionDisabled: boolean;
	isTitleEmpty: boolean;
	onContentChange: (content: string, blocks: PartialBlock[]) => void;
	onEnterEdit: () => void;
	onPageTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onRejectItem?: (() => void) | undefined;
	onTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
	showRejectItem?: boolean | undefined;
};

type TextContentItem = {
	text?: unknown;
};

const nodeTypeToLabel: Record<ProposedNodeType, string> = {
	[KnowledgeNodeType.ENTRY]: "Entry",
	[KnowledgeNodeType.PAGE]: "Page",
	[KnowledgeNodeType.SECTION]: "Section",
};

const getNodeTypeLabel = (
	type: ProposedNodeType | undefined,
	fallbackLabel: string,
): string => (type ? nodeTypeToLabel[type] : fallbackLabel);

const getNodeTitleLabel = (
	type: ProposedNodeType | undefined,
	fallbackLabel: string,
): string => `${getNodeTypeLabel(type, fallbackLabel)} title`;

const isTextContentItem = (item: unknown): item is TextContentItem => {
	return typeof item === "object" && item !== null && "text" in item;
};

const isNestedContentItem = (item: unknown): item is { content: unknown } => {
	return typeof item === "object" && item !== null && "content" in item;
};

const isTableContent = (content: unknown): content is { rows: unknown[] } => {
	return (
		typeof content === "object" &&
		content !== null &&
		"rows" in content &&
		Array.isArray(content.rows)
	);
};

const isTableRow = (row: unknown): row is { cells: unknown[] } => {
	return (
		typeof row === "object" &&
		row !== null &&
		"cells" in row &&
		Array.isArray(row.cells)
	);
};

const parseDatasetIndex = (value: string | undefined): null | number => {
	if (value === undefined) {
		return null;
	}

	const parsedValue = Number(value);

	return Number.isSafeInteger(parsedValue) && parsedValue >= EMPTY_LENGTH
		? parsedValue
		: null;
};

const getInlineText = (content: unknown): string => {
	if (typeof content === "string") {
		return content;
	}

	if (isTableContent(content)) {
		return content.rows
			.flatMap((row) => (isTableRow(row) ? row.cells : []))
			.map((cell) => getInlineText([cell]))
			.join(" ");
	}

	if (!Array.isArray(content)) {
		return "";
	}

	return content
		.map((item: unknown): string => {
			if (typeof item === "string") {
				return item;
			}

			if (Array.isArray(item)) {
				return getInlineText(item);
			}

			if (isTextContentItem(item)) {
				const { text } = item;

				return typeof text === "string" ? text : "";
			}

			if (isNestedContentItem(item)) {
				return getInlineText(item.content);
			}

			return "";
		})
		.join("");
};

const collectBlockTexts = (blocks: readonly EditorBlock[]): string[] => {
	return blocks.flatMap((block) => [
		getInlineText(block.content),
		...collectBlockTexts(block.children),
	]);
};

const blocksToText = (blocks: readonly EditorBlock[]): string => {
	return collectBlockTexts(blocks)
		.filter((text) => text.trim().length > EMPTY_LENGTH)
		.join("\n\n");
};

const textToBlocks = (text: string): PartialBlock[] => {
	const blocks = text
		.split(/\n{2,}/u)
		.map((blockText) => blockText.trim())
		.filter((blockText) => blockText.length > EMPTY_LENGTH)
		.map((blockText) => ({
			content: blockText,
			type: "paragraph" as const,
		}));

	if (blocks.length > EMPTY_LENGTH) {
		return blocks;
	}

	return [
		{
			content: "",
			type: "paragraph",
		},
	];
};

const CANCEL_LABEL = "Cancel";
const PUBLISH_RESOLUTION_LABEL = "Publish resolution";
const REVIEW_SECTIONS_FIRST_LABEL = "Review sections first";
const SAVE_DECISIONS_LABEL = "Save decisions";
const SINGLE_DECISION_COUNT = 1;

const DecisionSummary = ({
	conflictCount,
	isDecided,
	isDisabled,
	onOpen,
}: {
	conflictCount: number;
	isDecided: boolean;
	isDisabled: boolean;
	onOpen: () => void;
}): JSX.Element => {
	const sectionNoun =
		conflictCount === SINGLE_DECISION_COUNT
			? "section overlaps"
			: "sections overlap";

	return (
		<div
			className={getValidClassNames(
				"flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
				isDecided
					? "border-border bg-surface text-text-muted"
					: "border-warning/40 bg-warning-bg text-text",
			)}
		>
			<span>
				{String(conflictCount)} {sectionNoun} existing knowledge.{" "}
				{isDecided
					? "Your decisions are saved and will be applied on publish."
					: "Decide what to keep before publishing."}
			</span>
			<Button disabled={isDisabled} onClick={onOpen} variant="secondary">
				{isDecided ? "Change decisions" : "Decide now"}
			</Button>
		</div>
	);
};

const getSectionConflicts = (section: ProposedPage): FieldConflict[] => {
	if (section.status !== "conflict" && section.status !== "duplicate") {
		return [];
	}

	const liveTitle = section.originalTitle ?? section.title;
	const liveContent = section.originalContent ?? LIVE_KB_CONTENT_FALLBACK;
	const contentConflict: FieldConflict = {
		changeId: section.integrationChangeId,
		currentValue: liveContent,
		field: "content",
		id: `conf-content-${String(section.integrationChangeId)}`,
		incomingValue: section.content,
		matchedNodeId: section.matchedNodeId ?? null,
	};

	if (section.wordingMatches && section.wordingMatches.length > EMPTY_LENGTH) {
		contentConflict.matchIndex = FIRST_MATCH_INDEX;
		contentConflict.wordingMatches = section.wordingMatches;
	}

	return [
		{
			changeId: section.integrationChangeId,
			currentValue: liveTitle,
			field: "title",
			id: `conf-title-${String(section.integrationChangeId)}`,
			incomingValue: section.title,
			matchedNodeId: section.matchedNodeId ?? null,
		},
		contentConflict,
	];
};

const getAllIntegrationConflicts = (
	pages: ProposedSection[],
): FieldConflict[] => {
	const conflicts: FieldConflict[] = [];

	for (const page of pages) {
		for (const section of page.pages) {
			conflicts.push(...getSectionConflicts(section));
		}
	}

	return conflicts;
};

const editorBlockProperties = (
	blocks: PartialBlock[] | undefined,
): Record<string, never> | { blocks: PartialBlock[] } => {
	if (!blocks || blocks.length === EMPTY_LENGTH) {
		return {};
	}

	return { blocks };
};

const SectionContentEditor = ({
	blocks,
	content,
	highlights = [],
	isEditable = true,
	onContentChange,
	renderHighlightTooltip,
}: SectionContentEditorProperties): JSX.Element => {
	const [initialContent] = useState<PartialBlock[]>(() => {
		return blocks && blocks.length > EMPTY_LENGTH
			? blocks
			: textToBlocks(content);
	});

	const handleChange = useCallback(
		(editorBlocks: EditorBlock[]): void => {
			onContentChange?.(
				blocksToText(editorBlocks),
				editorBlocks as PartialBlock[],
			);
		},
		[onContentChange],
	);

	return (
		<KnowledgeEditor
			highlights={highlights}
			initialContent={initialContent}
			isEditable={isEditable}
			onChange={handleChange}
			{...(renderHighlightTooltip === undefined
				? {}
				: { renderHighlightTooltip })}
		/>
	);
};

type GlossaryHighlightTooltipContentProperties = {
	match: GlossaryConsistencyMatchDto;
	onAccept: (match: GlossaryConsistencyMatchDto) => void;
	onEdit: (match: GlossaryConsistencyMatchDto) => void;
	onKeep: (match: GlossaryConsistencyMatchDto) => void;
};

const GlossaryHighlightTooltipContent = ({
	match,
	onAccept,
	onEdit,
	onKeep,
}: GlossaryHighlightTooltipContentProperties): JSX.Element => {
	return (
		<div className="flex flex-col gap-1.5">
			<Paragraph className="text-xs text-text" size={ParagraphSize.BODY_SMALL}>
				Use <span className="font-medium">{match.canonicalName}</span>
			</Paragraph>
			<Paragraph
				className="text-2xs text-text-faint"
				size={ParagraphSize.BODY_SMALL}
			>
				{match.explanation}
			</Paragraph>
			<GlossarySuggestionActions
				match={match}
				onAccept={onAccept}
				onEdit={onEdit}
				onKeep={onKeep}
			/>
		</div>
	);
};

const SectionDetails = ({
	activeNodeType,
	activePage,
	activeSection,
	isContentEmpty,
	isEditMode,
	isInteractionDisabled,
	isTitleEmpty,
	onContentChange,
	onEnterEdit,
	onPageTitleChange,
	onRejectItem,
	onTitleChange,
	showRejectItem = false,
}: SectionDetailsProperties): JSX.Element => {
	const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

	const handleOpenRejectModal = useCallback((): void => {
		setIsRejectModalOpen(true);
	}, []);

	const handleCloseRejectModal = useCallback((): void => {
		setIsRejectModalOpen(false);
	}, []);

	const handleConfirmReject = useCallback((): void => {
		setIsRejectModalOpen(false);
		onRejectItem?.();
	}, [onRejectItem]);

	const isParentSelected = activeNodeType === "parent";
	const selectedNode = isParentSelected ? activePage : activeSection;

	const activeSectionBlocks = activeSection?.blocks;
	const acceptingGlossaryMatchReference =
		useRef<GlossaryConsistencyMatchDto | null>(null);

	const handleGlossaryContentChange = useCallback(
		(content: string): void => {
			const match = acceptingGlossaryMatchReference.current;
			acceptingGlossaryMatchReference.current = null;
			const replacedBlocks =
				match && activeSectionBlocks
					? replaceTextInBlocks(activeSectionBlocks, {
							from: match.sourceExcerpt,
							to: match.suggestedText,
						})
					: null;

			onContentChange(content, replacedBlocks ?? textToBlocks(content));
		},
		[activeSectionBlocks, onContentChange],
	);

	const {
		glossaryMatches,
		isCheckingGlossary,
		onAcceptGlossarySuggestion,
		onKeepGlossarySuggestion: handleKeepGlossarySuggestion,
	} = useGlossaryConsistencyCheck({
		content: isParentSelected ? "" : (activeSection?.content ?? ""),
		onContentChange: handleGlossaryContentChange,
		sectionId: selectedNode?.id ?? "",
	});

	const handleAcceptGlossarySuggestion = useCallback(
		(match: GlossaryConsistencyMatchDto): void => {
			acceptingGlossaryMatchReference.current = match;
			onAcceptGlossarySuggestion(match);
		},
		[onAcceptGlossarySuggestion],
	);

	const handleEditGlossarySuggestion = useCallback(
		(match: GlossaryConsistencyMatchDto): void => {
			handleKeepGlossarySuggestion(match);
			onEnterEdit();
		},
		[handleKeepGlossarySuggestion, onEnterEdit],
	);

	const glossaryHighlights = useMemo(
		() =>
			toGlossaryHighlights(glossaryMatches, TextHighlightVariant.SUGGESTION),
		[glossaryMatches],
	);
	const glossaryMatchesById = useMemo(
		() =>
			new Map(
				glossaryMatches.map((match) => [toGlossaryHighlightId(match), match]),
			),
		[glossaryMatches],
	);
	const renderGlossaryHighlightTooltip = useCallback(
		(highlightId: string): ReactNode => {
			const match = glossaryMatchesById.get(highlightId);

			if (!match) {
				return null;
			}

			return (
				<GlossaryHighlightTooltipContent
					match={match}
					onAccept={handleAcceptGlossarySuggestion}
					onEdit={handleEditGlossarySuggestion}
					onKeep={handleKeepGlossarySuggestion}
				/>
			);
		},
		[
			glossaryMatchesById,
			handleAcceptGlossarySuggestion,
			handleEditGlossarySuggestion,
			handleKeepGlossarySuggestion,
		],
	);

	if (!selectedNode) {
		return (
			<div className="flex flex-1 min-w-0 flex-col gap-3 p-3.5 tablet:p-6 tablet:overflow-y-auto">
				<Paragraph size={ParagraphSize.BODY_SMALL}>
					Select a node from the proposed tree to view details.
				</Paragraph>
			</div>
		);
	}

	const currentTitle =
		selectedNode.title.trim().length > EMPTY_LENGTH
			? selectedNode.title
			: "Untitled node";
	const breadcrumbLabel =
		isParentSelected || !activePage
			? currentTitle
			: `${activePage.title} > ${currentTitle}`;
	const selectedTitleLabel = getNodeTitleLabel(selectedNode.type, "Node");
	const editorKey = `${selectedNode.id}-${isEditMode ? "edit" : "view"}`;
	const readOnlyEditorKey = `${editorKey}-${activeSection?.content ?? ""}`;
	const handleTitleChange = isParentSelected
		? onPageTitleChange
		: onTitleChange;

	return (
		<div className="flex flex-1 min-w-0 flex-col gap-3 p-3.5 tablet:p-6 tablet:overflow-y-auto">
			<div className="flex flex-col gap-2 border-b border-border-subtle pb-3">
				<div
					className={getValidClassNames(
						"flex items-center justify-between gap-2 transition-opacity",
						{ "opacity-40 pointer-events-none": isEditMode },
					)}
				>
					<span className="font-mono text-2xs uppercase tracking-wide text-text-muted truncate block min-w-0 flex-1">
						{breadcrumbLabel}
					</span>

					{showRejectItem && !isParentSelected && onRejectItem && (
						<Button
							disabled={isInteractionDisabled}
							onClick={handleOpenRejectModal}
							variant="secondary"
						>
							Reject item
						</Button>
					)}

					<span
						className={getValidClassNames(
							"rounded-full px-2.5 py-0.5 font-sans text-2xs font-medium border shrink-0 whitespace-nowrap",
							{
								"bg-info-bg text-info border-info/25":
									selectedNode.status === "modified",
								"bg-secondary text-text-muted border-border":
									selectedNode.status === "duplicate",
								"bg-success-bg text-accent border-accent/25":
									selectedNode.status === "created",
								"bg-warning-bg text-warning border-warning/35":
									selectedNode.status === "conflict",
							},
						)}
					>
						{formatChangeStatusLabel(selectedNode.status)}
					</span>
				</div>

				{isEditMode ? (
					<div className="flex w-full flex-col gap-1">
						<span className="font-sans text-2xs font-semibold uppercase tracking-wide text-text-muted">
							{selectedTitleLabel}
						</span>
						<input
							className={getValidClassNames(
								"w-full min-w-0 rounded-md border bg-surface px-3 py-2 font-sans text-sm font-medium text-text transition-colors focus:outline-none",
								isTitleEmpty
									? "border-error focus:border-error"
									: "border-border focus:border-accent",
							)}
							maxLength={TITLE_MAX_LENGTH}
							onChange={handleTitleChange}
							placeholder={`Enter ${selectedTitleLabel.toLowerCase()}...`}
							value={selectedNode.title}
						/>
						<div className="flex items-center justify-between text-2xs font-sans">
							{isTitleEmpty ? (
								<span className="text-error font-medium">
									{selectedTitleLabel} cannot be empty
								</span>
							) : (
								<span />
							)}
							<span className="text-text-faint">
								{selectedNode.title.length}/{TITLE_MAX_LENGTH}
							</span>
						</div>
					</div>
				) : (
					<Heading
						className="font-serif text-lg tablet:text-h2 font-bold tracking-tight text-text"
						level="1"
					>
						{selectedNode.title}
					</Heading>
				)}
			</div>

			{activeSection && !isParentSelected && (
				<div className="rounded-md border border-border-subtle bg-secondary/40 p-3 text-xs text-text-muted">
					{activeSection.sourcePageNumber !== undefined && (
						<p className="font-medium text-text">
							Source page: {activeSection.sourcePageNumber}
						</p>
					)}
					{activeSection.sourceExcerpt && (
						<p className="mt-1 whitespace-pre-wrap">
							Source excerpt: {activeSection.sourceExcerpt}
						</p>
					)}
					{activeSection.proposedHeading && (
						<p className="mt-1">
							Proposed heading: {activeSection.proposedHeading}
						</p>
					)}
					{activeSection.proposedPlace && (
						<p className="mt-1">
							Proposed place: {activeSection.proposedPlace}
						</p>
					)}
				</div>
			)}

			{activeSection && !isParentSelected && (
				<div className="flex flex-1 min-w-0 flex-col gap-3">
					{isEditMode ? (
						<div className="flex flex-1 flex-col gap-1">
							<div
								className={getValidClassNames(
									"min-h-40 tablet:min-h-72 w-full flex-1 rounded-md border bg-white p-3 tablet:p-4 transition-colors ring-2 ring-accent",
									isContentEmpty
										? "border-error"
										: "border-border focus:border-accent",
								)}
							>
								<SectionContentEditor
									{...editorBlockProperties(activeSection.blocks)}
									content={activeSection.content}
									key={editorKey}
									onContentChange={onContentChange}
								/>
							</div>
							{isContentEmpty && (
								<span className="text-error font-sans text-2xs font-medium">
									Content cannot be empty
								</span>
							)}
						</div>
					) : (
						<div className="min-h-48 tablet:min-h-80 flex-1 rounded-md border border-border-subtle bg-bg p-3.5 tablet:p-5">
							<SectionContentEditor
								{...editorBlockProperties(activeSection.blocks)}
								content={activeSection.content}
								highlights={glossaryHighlights}
								isEditable={false}
								key={readOnlyEditorKey}
								renderHighlightTooltip={renderGlossaryHighlightTooltip}
							/>
						</div>
					)}

					<GlossarySuggestions
						canAccept={!isEditMode}
						isChecking={isCheckingGlossary}
						matches={glossaryMatches}
						onAccept={handleAcceptGlossarySuggestion}
						onEdit={handleEditGlossarySuggestion}
						onKeep={handleKeepGlossarySuggestion}
						variant={TextHighlightVariant.SUGGESTION}
					/>
				</div>
			)}

			{isParentSelected && (
				<div className="flex flex-1 min-w-0 items-center justify-center rounded-md border border-dashed border-border-subtle bg-bg p-6 text-center">
					<div className="max-w-sm">
						<Paragraph
							className="text-sm leading-relaxed text-text-muted"
							size={ParagraphSize.BODY_SMALL}
						>
							Select a child page to edit content.
						</Paragraph>
					</div>
				</div>
			)}

			<Modal
				hasCloseButton={true}
				isOpen={isRejectModalOpen}
				onClose={handleCloseRejectModal}
				size="small"
				title="Reject Knowledge item"
			>
				<div className="flex flex-col gap-4">
					<Paragraph size={ParagraphSize.BODY_SMALL}>
						Are you sure you want to reject this item? This action cannot be
						undone.
					</Paragraph>
					<div className="flex justify-end gap-2 pt-2">
						<Button onClick={handleCloseRejectModal} variant="secondary">
							Cancel
						</Button>
						<Button onClick={handleConfirmReject} variant="primary">
							Reject
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

const PreviewFooter = ({
	approveLabel,
	canEdit,
	canSubmitReview,
	isApplying,
	isEditInvalid,
	isEditMode,
	onApprove,
	onCancelDocument,
	onCancelEdit,
	onClose,
	onEnterEdit,
	onSaveEdit,
	submitBlockedReason,
}: PreviewFooterProperties): JSX.Element => (
	<div className="flex shrink-0 flex-col gap-2 border-t border-border-subtle pt-2 px-1">
		{!isEditMode && !canSubmitReview && submitBlockedReason && (
			<span className="text-error font-sans text-2xs font-medium">
				{submitBlockedReason}
			</span>
		)}
		<div className="flex flex-wrap items-center justify-between gap-2">
			{isEditMode ? (
				<div className="flex w-full tablet:w-auto items-center justify-between tablet:justify-start gap-2 tablet:gap-3">
					<span className="hidden tablet:block font-sans text-2xs text-text-muted">
						{EDIT_HINT}
					</span>
					<Button
						className="flex-1 tablet:flex-initial tablet:w-auto"
						disabled={isApplying}
						onClick={onCancelEdit}
						variant="secondary"
					>
						Cancel
					</Button>
					<Button
						className="flex-1 tablet:flex-initial tablet:w-auto"
						disabled={isApplying || isEditInvalid}
						onClick={onSaveEdit}
						variant="primary"
					>
						Save
					</Button>
				</div>
			) : (
				<>
					<Button
						disabled={!canEdit || isApplying}
						onClick={onEnterEdit}
						variant="secondary"
					>
						Edit
					</Button>

					<div className="flex items-center justify-end gap-2">
						{onCancelDocument && (
							<Button
								disabled={isApplying}
								onClick={onCancelDocument}
								variant="secondary"
							>
								Discard document
							</Button>
						)}
						<Button disabled={isApplying} onClick={onClose} variant="secondary">
							Back
						</Button>
						<Button
							disabled={!canSubmitReview || isApplying}
							onClick={onApprove}
							variant="primary"
						>
							<Icon name="checkbox-tick" size={ICON_SIZE_MEDIUM} />
							<span>{approveLabel}</span>
						</Button>
					</div>
				</>
			)}
		</div>
	</div>
);

const seedReviewPages = (
	proposedStructure: ProposedSection[],
	placementStructure: ProposedSection[] | undefined,
): ProposedSection[] =>
	placementStructure && placementStructure.length > EMPTY_LENGTH
		? mergePlacementIntoPages(proposedStructure, placementStructure)
		: proposedStructure;

const syncIncomingReviewPages = ({
	appliedPlacement,
	backupPages,
	pages,
	placementStructure,
	proposedStructure,
	seededProposal,
	setAppliedPlacement,
	setBackupPages,
	setPages,
	setSeededProposal,
}: {
	appliedPlacement: ProposedSection[] | undefined;
	backupPages: ProposedSection[];
	pages: ProposedSection[];
	placementStructure: ProposedSection[] | undefined;
	proposedStructure: ProposedSection[];
	seededProposal: ProposedSection[];
	setAppliedPlacement: (placement: ProposedSection[] | undefined) => void;
	setBackupPages: (pages: ProposedSection[]) => void;
	setPages: (pages: ProposedSection[]) => void;
	setSeededProposal: (pages: ProposedSection[]) => void;
}): void => {
	if (
		pages.length === EMPTY_LENGTH &&
		proposedStructure.length > EMPTY_LENGTH &&
		seededProposal.length === EMPTY_LENGTH
	) {
		const seededPages = seedReviewPages(proposedStructure, placementStructure);

		setSeededProposal(proposedStructure);
		setPages(seededPages);
		setBackupPages(seededPages);
	}

	if (placementStructure === appliedPlacement) {
		return;
	}

	setAppliedPlacement(placementStructure);

	if (
		placementStructure &&
		placementStructure.length > EMPTY_LENGTH &&
		pages.length > EMPTY_LENGTH
	) {
		setPages(mergePlacementIntoPages(pages, placementStructure));
		setBackupPages(mergePlacementIntoPages(backupPages, placementStructure));
	}
};

const getReviewSubmitState = ({
	hasBlankEntry,
	remainingExtractionItemCount,
}: {
	hasBlankEntry: boolean;
	remainingExtractionItemCount: number;
}): {
	approveLabel: string;
	canSubmitReview: boolean;
	submitBlockedReason: string | undefined;
} => {
	const approveLabel =
		remainingExtractionItemCount === EMPTY_LENGTH
			? FINISH_WITHOUT_PUBLISHING_LABEL
			: PUBLISH_LABEL;
	const submitBlockedReason =
		hasBlankEntry && remainingExtractionItemCount > EMPTY_LENGTH
			? BLANK_REVIEW_MESSAGE
			: undefined;

	return {
		approveLabel,
		canSubmitReview:
			remainingExtractionItemCount === EMPTY_LENGTH || !hasBlankEntry,
		submitBlockedReason,
	};
};

const IntegrationPreview: React.FC<IntegrationPreviewProperties> = ({
	errorMessage,
	failedPageNumbers = [],
	onAddMore,
	onApplyingChange,
	onApprove,
	onCancelDocument,
	onClose,
	placementStructure,
	placementTargets = NO_PLACEMENT_TARGETS,
	proposedStructure,
}: IntegrationPreviewProperties): JSX.Element => {
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [initialPages] = useState<ProposedSection[]>(() =>
		seedReviewPages(proposedStructure, placementStructure),
	);
	const [pages, setPages] = useState<ProposedSection[]>(initialPages);
	const [backupPages, setBackupPages] =
		useState<ProposedSection[]>(initialPages);
	const [appliedPlacement, setAppliedPlacement] = useState(placementStructure);
	const [seededProposal, setSeededProposal] = useState(proposedStructure);

	syncIncomingReviewPages({
		appliedPlacement,
		backupPages,
		pages,
		placementStructure,
		proposedStructure,
		seededProposal,
		setAppliedPlacement,
		setBackupPages,
		setPages,
		setSeededProposal,
	});
	const [activePageIndex, setActivePageIndex] =
		useState<number>(DEFAULT_PAGE_INDEX);
	const [activeSectionIndex, setActiveSectionIndex] = useState<number>(
		DEFAULT_SECTION_INDEX,
	);
	const [activeNodeType, setActiveNodeType] = useState<ActiveNodeType>("child");
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
	const [isMergeScreenOpen, setIsMergeScreenOpen] = useState<boolean>(false);
	const [savedConflicts, setSavedConflicts] = useState<FieldConflict[]>([]);
	const [isDecisionStepSkipped, setIsDecisionStepSkipped] =
		useState<boolean>(false);
	const [isPublishAfterDecision, setIsPublishAfterDecision] =
		useState<boolean>(false);
	const [isApplying, setIsApplying] = useState<boolean>(false);

	const setApplyingState = useCallback(
		(isApplyingValue: boolean): void => {
			setIsApplying(isApplyingValue);
			onApplyingChange?.(isApplyingValue);
		},
		[onApplyingChange],
	);

	const activePage = pages[activePageIndex] ?? pages[DEFAULT_PAGE_INDEX];
	const activeSection =
		activePage?.pages[activeSectionIndex] ??
		activePage?.pages[DEFAULT_SECTION_INDEX];
	const selectedNode = activeNodeType === "parent" ? activePage : activeSection;
	const canEditSelectedNode =
		activeNodeType === "child" ||
		Boolean(activePage && isManualPage(activePage));

	const isTitleEmpty =
		(selectedNode?.title.trim().length ?? EMPTY_LENGTH) === EMPTY_LENGTH;
	const isContentEmpty =
		(activeSection?.content.trim().length ?? EMPTY_LENGTH) === EMPTY_LENGTH;
	const isEditInvalid =
		isTitleEmpty || (activeNodeType === "child" && isContentEmpty);

	const handleAddMoreAndClose = useCallback((): void => {
		setIsSuccessModalOpen(false);
		onAddMore();
	}, [onAddMore]);

	const placementPageIds = useMemo(
		() => new Set(placementTargets.map((target) => target.id)),
		[placementTargets],
	);

	const integrationConflicts = useMemo(
		() => getAllIntegrationConflicts(pages),
		[pages],
	);
	const areDecisionsSaved =
		integrationConflicts.length > EMPTY_LENGTH &&
		hasSavedResolutions(integrationConflicts, savedConflicts);
	const isDecisionStepPending =
		integrationConflicts.length > EMPTY_LENGTH &&
		!areDecisionsSaved &&
		!isDecisionStepSkipped;

	const publishPages = useCallback(
		async (
			pagesToPublish: ProposedSection[],
			conflicts: FieldConflict[],
			conflictPages: ProposedSection[] = pagesToPublish,
		): Promise<void> => {
			if (isApplying) {
				return;
			}

			setApplyingState(true);

			if (!onApprove) {
				setApplyingState(false);

				return;
			}

			let isApplied: boolean;

			try {
				isApplied = await onApprove({
					contentOverrides: toContentOverrides(pagesToPublish),
					items: toPublishedItems(pagesToPublish),
					placements: toPublishedPlacements(pagesToPublish, placementPageIds),
					resolutions: toConflictResolutions({
						conflicts,
						sections: conflictPages,
					}),
				});
			} catch {
				return;
			} finally {
				setApplyingState(false);
			}

			if (isApplied) {
				setIsMergeScreenOpen(false);
				setIsSuccessModalOpen(true);
			}
		},
		[isApplying, onApprove, placementPageIds, setApplyingState],
	);

	const handleApprove = useCallback((): void => {
		if (isApplying) {
			return;
		}

		const remainingSectionCount = pages.reduce(
			(count, section) => count + section.pages.length,
			EMPTY_LENGTH,
		);

		if (remainingSectionCount === EMPTY_LENGTH) {
			void publishPages(pages, []);

			return;
		}

		if (integrationConflicts.length === EMPTY_LENGTH) {
			void publishPages(pages, []);

			return;
		}

		if (hasSavedResolutions(integrationConflicts, savedConflicts)) {
			const decidedConflicts = withSavedResolutions(
				integrationConflicts,
				savedConflicts,
			);

			void publishPages(pages, decidedConflicts);

			return;
		}

		setIsPublishAfterDecision(true);
		setIsMergeScreenOpen(true);
	}, [integrationConflicts, isApplying, pages, publishPages, savedConflicts]);

	const handleOpenDecisions = useCallback((): void => {
		setIsPublishAfterDecision(false);
		setIsMergeScreenOpen(true);
	}, []);

	const handleRejectItem = useCallback((): void => {
		const { nextPageIndex, nextPages, nextSectionIndex } = rejectActiveSection({
			activePageIndex,
			activeSectionIndex,
			pages,
		});

		setPages(nextPages);
		setActivePageIndex(nextPageIndex);
		setActiveSectionIndex(nextSectionIndex);
		setActiveNodeType("child");
	}, [activePageIndex, activeSectionIndex, pages]);

	const handleCancelEdit = useCallback((): void => {
		setPages(backupPages);
		setIsEditMode(false);
	}, [backupPages]);

	const handleOpenCancelModal = useCallback((): void => {
		setIsCancelModalOpen(true);
	}, []);

	const handleCloseCancelModal = useCallback((): void => {
		setIsCancelModalOpen(false);
	}, []);

	const handleConfirmCancel = useCallback((): void => {
		setIsCancelModalOpen(false);
		onCancelDocument?.();
	}, [onCancelDocument]);

	const handleCancelMerge = useCallback((): void => {
		if (isApplying) {
			return;
		}

		setIsMergeScreenOpen(false);
		setIsPublishAfterDecision(false);
		setIsDecisionStepSkipped(true);
	}, [isApplying]);

	const handleSaveDecisions = useCallback(
		(resolvedConflicts: FieldConflict[]): void => {
			setSavedConflicts(resolvedConflicts);

			if (isPublishAfterDecision) {
				void publishPages(pages, resolvedConflicts);

				return;
			}

			setIsMergeScreenOpen(false);
		},
		[isPublishAfterDecision, pages, publishPages],
	);

	const handleRenameSection = useCallback(
		(pageIndex: number, sectionIndex: number): void => {
			if (isApplying) {
				return;
			}

			setActivePageIndex(pageIndex);
			setActiveSectionIndex(sectionIndex);
			setActiveNodeType("child");
			setBackupPages(pages);
			setIsEditMode(true);
		},
		[isApplying, pages],
	);

	const handleMoveSectionTo = useCallback(
		(
			pageIndex: number,
			sectionIndex: number,
			targetId: null | number,
		): void => {
			const target = placementTargets.find((item) => item.id === targetId);

			setPages((previousPages) =>
				updateSectionInPages({
					pageIndex,
					pages: previousPages,
					partialSection: {
						placementParentExtractionItemId: null,
						placementParentId: target?.id ?? null,
						proposedPlace: target
							? `${UNDER_PLACE_PREFIX}${target.title}`
							: DOCUMENT_PAGE_LABEL,
					},
					sectionIndex,
				}),
			);
		},
		[placementTargets],
	);

	const handleEnterEdit = useCallback((): void => {
		if (!canEditSelectedNode || isApplying) {
			return;
		}

		setBackupPages(pages);
		setIsEditMode(true);
	}, [canEditSelectedNode, isApplying, pages]);

	const handleGoToKB = useCallback((): void => {
		setIsSuccessModalOpen(false);
		onClose();
	}, [onClose]);

	const handleSaveEdit = useCallback((): void => {
		if (isEditInvalid) {
			return;
		}

		setIsEditMode(false);
	}, [isEditInvalid]);

	const sectionPositions = useMemo(() => toSectionPositions(pages), [pages]);
	const currentSectionPosition = sectionPositions.findIndex(
		(position) =>
			position.pageIndex === activePageIndex &&
			position.sectionIndex === activeSectionIndex,
	);

	const handleMoveEditedSection = useCallback(
		(step: number): void => {
			const target = sectionPositions[currentSectionPosition + step];

			if (isEditInvalid || !target) {
				return;
			}

			setActivePageIndex(target.pageIndex);
			setActiveSectionIndex(target.sectionIndex);
			setActiveNodeType("child");
		},
		[currentSectionPosition, isEditInvalid, sectionPositions],
	);

	const handleNextSection = useCallback((): void => {
		handleMoveEditedSection(NEXT_SECTION_STEP);
	}, [handleMoveEditedSection]);

	const handlePreviousSection = useCallback((): void => {
		handleMoveEditedSection(PREVIOUS_SECTION_STEP);
	}, [handleMoveEditedSection]);

	const handleReviewKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>): void => {
			if (!isEditMode || !canEditSelectedNode || event.defaultPrevented) {
				return;
			}

			if (event.key === "Escape") {
				event.preventDefault();
				handleCancelEdit();
			} else if (event.altKey && event.key === "ArrowDown") {
				event.preventDefault();
				handleNextSection();
			} else if (event.altKey && event.key === "ArrowUp") {
				event.preventDefault();
				handlePreviousSection();
			}
		},
		[
			canEditSelectedNode,
			handleCancelEdit,
			handleNextSection,
			handlePreviousSection,
			isEditMode,
		],
	);

	const handleSectionContentChange = useCallback(
		(newContent: string, blocks: PartialBlock[]): void => {
			setPages((previousPages) =>
				updateSectionInPages({
					pageIndex: activePageIndex,
					pages: previousPages,
					partialSection: { blocks, content: newContent },
					sectionIndex: activeSectionIndex,
				}),
			);
		},
		[activePageIndex, activeSectionIndex],
	);

	const handlePageTitleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			const newTitle = event.target.value;
			setPages((previousPages) =>
				updatePageInPages({
					pageIndex: activePageIndex,
					pages: previousPages,
					partialPage: { title: newTitle },
				}),
			);
		},
		[activePageIndex],
	);

	const handleSectionTitleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			const newTitle = event.target.value;
			setPages((previousPages) =>
				updateSectionInPages({
					pageIndex: activePageIndex,
					pages: previousPages,
					partialSection: { title: newTitle },
					sectionIndex: activeSectionIndex,
				}),
			);
		},
		[activePageIndex, activeSectionIndex],
	);

	const handleSelectPage = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const pageIndex = parseDatasetIndex(
				event.currentTarget.dataset["pageIndex"],
			);

			if (pageIndex !== null) {
				setActivePageIndex(pageIndex);
				setActiveNodeType("parent");
			}
		},
		[],
	);

	const handleSelectSection = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const target = event.currentTarget;
			const pageIndex = parseDatasetIndex(target.dataset["pageIndex"]);
			const sectionIndex = parseDatasetIndex(target.dataset["sectionIndex"]);

			if (pageIndex !== null && sectionIndex !== null) {
				setActivePageIndex(pageIndex);
				setActiveSectionIndex(sectionIndex);
				setActiveNodeType("child");
			}
		},
		[],
	);

	const handleDeletePage = useCallback(
		(pageIndex: number): void => {
			const nextPages = removePageGroup(pages, pageIndex);

			if (nextPages === pages) {
				return;
			}

			setPages(nextPages);

			if (pageIndex === activePageIndex) {
				setActivePageIndex(DEFAULT_PAGE_INDEX);
				setActiveSectionIndex(DEFAULT_SECTION_INDEX);
				setActiveNodeType("child");
			} else if (pageIndex < activePageIndex) {
				setActivePageIndex(activePageIndex - LAST_INDEX_OFFSET);
			}
		},
		[activePageIndex, pages],
	);

	const handleDeleteSection = useCallback(
		(pageIndex: number, sectionIndex: number): void => {
			const activePageId = activePage?.id;
			const activeSectionId = activeSection?.id;
			const nextPages = removeSectionFromPages({
				activePageIndex: pageIndex,
				activeSectionIndex: sectionIndex,
				pages,
			});

			setPages(nextPages);

			const nextPageIndex = activePageId
				? nextPages.findIndex((page) => page.id === activePageId)
				: NOT_FOUND_INDEX;

			if (nextPageIndex === NOT_FOUND_INDEX) {
				setActivePageIndex(DEFAULT_PAGE_INDEX);
				setActiveSectionIndex(DEFAULT_SECTION_INDEX);
				setActiveNodeType("child");

				return;
			}

			const nextSectionIndex = activeSectionId
				? (nextPages[nextPageIndex]?.pages.findIndex(
						(section) => section.id === activeSectionId,
					) ?? NOT_FOUND_INDEX)
				: NOT_FOUND_INDEX;

			setActivePageIndex(nextPageIndex);
			setActiveSectionIndex(
				nextSectionIndex === NOT_FOUND_INDEX
					? DEFAULT_SECTION_INDEX
					: nextSectionIndex,
			);
		},
		[activePage, activeSection, pages],
	);

	const handleMovePage = useCallback(
		(activeId: string, overId: string): void => {
			const activePageId = activePage?.id;
			const nextPages = movePageGroup(pages, activeId, overId);

			if (nextPages === pages) {
				return;
			}

			setPages(nextPages);

			const nextIndex = activePageId
				? nextPages.findIndex((page) => page.id === activePageId)
				: NOT_FOUND_INDEX;

			if (nextIndex !== NOT_FOUND_INDEX) {
				setActivePageIndex(nextIndex);
			}
		},
		[activePage, pages],
	);

	const handleMoveSection = useCallback(
		(activeId: string, overId: string): void => {
			const activeSectionId = activeSection?.id;
			const nextPages = moveSectionAcrossPages(pages, activeId, overId);

			if (nextPages === pages) {
				return;
			}

			setPages(nextPages);

			if (!activeSectionId) {
				return;
			}

			const nextPageIndex = nextPages.findIndex((page) =>
				page.pages.some((section) => section.id === activeSectionId),
			);

			if (nextPageIndex === NOT_FOUND_INDEX) {
				return;
			}

			const nextSectionIndex =
				nextPages[nextPageIndex]?.pages.findIndex(
					(section) => section.id === activeSectionId,
				) ?? NOT_FOUND_INDEX;

			if (nextSectionIndex !== NOT_FOUND_INDEX) {
				setActivePageIndex(nextPageIndex);
				setActiveSectionIndex(nextSectionIndex);
			}
		},
		[activeSection, pages],
	);

	if (isMergeScreenOpen || isDecisionStepPending) {
		return (
			<>
				<MergeScreen
					cancelLabel={
						isPublishAfterDecision ? CANCEL_LABEL : REVIEW_SECTIONS_FIRST_LABEL
					}
					conflicts={withSavedResolutions(integrationConflicts, savedConflicts)}
					isApplying={isApplying}
					onCancel={handleCancelMerge}
					onPublish={handleSaveDecisions}
					submitLabel={
						isPublishAfterDecision
							? PUBLISH_RESOLUTION_LABEL
							: SAVE_DECISIONS_LABEL
					}
				/>
				<ProposedStructureSuccessModal
					isOpen={isSuccessModalOpen}
					onAddMore={handleAddMoreAndClose}
					onGoToKnowledgeBase={handleGoToKB}
				/>
			</>
		);
	}

	const hasContent = pages.length > EMPTY_LENGTH && Boolean(activeSection);
	const canEnterEdit =
		canEditSelectedNode &&
		(activeNodeType === "parent" ? Boolean(activePage) : hasContent);

	const remainingExtractionItemCount = pages.reduce(
		(count, section) => count + section.pages.length,
		EMPTY_LENGTH,
	);
	const hasBlankEntry = pages.some(
		(page) =>
			page.pages.length > EMPTY_LENGTH &&
			(page.title.trim().length === EMPTY_LENGTH ||
				page.pages.some(
					(section) =>
						section.title.trim().length === EMPTY_LENGTH ||
						section.content.trim().length === EMPTY_LENGTH,
				)),
	);
	const { approveLabel, canSubmitReview, submitBlockedReason } =
		getReviewSubmitState({
			hasBlankEntry,
			remainingExtractionItemCount,
		});

	return (
		<div
			className="mx-auto flex h-full w-full max-w-7xl flex-col justify-between gap-3 p-3 tablet:p-4 pb-2 tablet:pb-4 font-sans text-text"
			onKeyDown={handleReviewKeyDown}
			role="presentation"
		>
			{errorMessage && (
				<Alert
					description={errorMessage}
					title="Review could not be saved"
					variant="error"
				/>
			)}
			{failedPageNumbers.length > EMPTY_LENGTH && (
				<Alert
					description={toFailedPagesMessage(failedPageNumbers)}
					title="Some pages could not be processed"
					variant="warning"
				/>
			)}
			{integrationConflicts.length > EMPTY_LENGTH && (
				<DecisionSummary
					conflictCount={
						new Set(integrationConflicts.map((item) => item.changeId)).size
					}
					isDecided={areDecisionsSaved}
					isDisabled={isApplying}
					onOpen={handleOpenDecisions}
				/>
			)}
			<div
				className={getValidClassNames(
					"flex flex-1 min-h-0 flex-col tablet:flex-row overflow-y-auto tablet:overflow-hidden rounded-lg border border-border bg-surface shadow-sm",
					{
						"[&>aside]:opacity-40 [&>aside]:pointer-events-none":
							isEditMode && canEditSelectedNode,
					},
				)}
			>
				<StructureAside
					activeNodeType={activeNodeType}
					activePageIndex={activePageIndex}
					activeSectionIndex={activeSectionIndex}
					isExtractionValidation={IS_EXTRACTION_VALIDATION}
					isInteractionDisabled={isApplying}
					onDeletePage={handleDeletePage}
					onDeleteSection={handleDeleteSection}
					onMovePage={handleMovePage}
					onMoveSection={handleMoveSection}
					onMoveSectionTo={handleMoveSectionTo}
					onRenameSection={handleRenameSection}
					onSelectPage={handleSelectPage}
					onSelectSection={handleSelectSection}
					pages={pages}
					placementTargets={placementTargets}
				/>

				<SectionDetails
					activeNodeType={activeNodeType}
					activePage={activePage}
					activeSection={activeSection}
					isContentEmpty={isContentEmpty}
					isEditMode={isEditMode && canEditSelectedNode}
					isInteractionDisabled={isApplying}
					isTitleEmpty={isTitleEmpty}
					key={selectedNode?.id}
					onContentChange={handleSectionContentChange}
					onEnterEdit={handleEnterEdit}
					onPageTitleChange={handlePageTitleChange}
					onRejectItem={handleRejectItem}
					onTitleChange={handleSectionTitleChange}
					showRejectItem={IS_EXTRACTION_VALIDATION}
				/>
			</div>

			{isEditMode &&
				canEditSelectedNode &&
				activeNodeType === "child" &&
				currentSectionPosition !== NOT_FOUND_INDEX && (
					<SectionNavigator
						currentPosition={currentSectionPosition}
						isDisabled={isApplying}
						onDone={handleSaveEdit}
						onNext={handleNextSection}
						onPrevious={handlePreviousSection}
						total={sectionPositions.length}
					/>
				)}

			<PreviewFooter
				approveLabel={approveLabel}
				canEdit={canEnterEdit}
				canSubmitReview={canSubmitReview}
				isApplying={isApplying}
				isEditInvalid={isEditInvalid}
				isEditMode={isEditMode && canEditSelectedNode}
				onApprove={handleApprove}
				onCancelDocument={onCancelDocument ? handleOpenCancelModal : undefined}
				onCancelEdit={handleCancelEdit}
				onClose={onClose}
				onEnterEdit={handleEnterEdit}
				onSaveEdit={handleSaveEdit}
				submitBlockedReason={submitBlockedReason}
			/>

			<Modal
				hasCloseButton={true}
				isOpen={isCancelModalOpen}
				onClose={handleCloseCancelModal}
				size="small"
				title="Discard this document?"
			>
				<div className="flex flex-col gap-4">
					<Paragraph size={ParagraphSize.BODY_SMALL}>
						Its extracted knowledge and your review edits will be discarded.
						Nothing from this document will be added to the knowledge base.
					</Paragraph>
					<div className="flex justify-end gap-2 pt-2">
						<Button onClick={handleCloseCancelModal} variant="secondary">
							Keep reviewing
						</Button>
						<Button onClick={handleConfirmCancel} variant="primary">
							Discard document
						</Button>
					</div>
				</div>
			</Modal>

			<ProposedStructureSuccessModal
				isOpen={isSuccessModalOpen}
				onAddMore={handleAddMoreAndClose}
				onGoToKnowledgeBase={handleGoToKB}
			/>
		</div>
	);
};

export { IntegrationPreview };
