import {
	type Block,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
	type PartialBlock,
} from "@blocknote/core";
import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type ChangeEvent,
	type JSX,
	type MouseEvent,
	useCallback,
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
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import {
	addPageGroup,
	addSectionToPage,
	isManualPage,
	movePageGroup,
	moveSectionAcrossPages,
	rejectActiveSection,
	removePageGroup,
	removeSectionFromPages,
	toConflictResolutions,
	updatePageInPages,
	updateSectionInPages,
} from "~/modules/knowledge/libs/helpers/helpers.js";
import {
	type ActiveNodeType,
	type FieldConflict,
	type IntegrationPreviewProperties,
	type ProposedPage,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

import { MergeScreen } from "./libs/components/merge-screen.js";
import { ProposedStructureSuccessModal } from "./libs/components/proposed-structure-success-modal.js";
import {
	formatChangeStatusLabel,
	StructureAside,
} from "./libs/components/structure-aside.js";
import { DEFAULT_PAGE_INDEX, DEFAULT_SECTION_INDEX } from "./libs/constants.js";
import { toFailedPagesMessage } from "./libs/helpers/to-failed-pages-message.helper.js";

const EMPTY_LENGTH = 0;
const LAST_INDEX_OFFSET = 1;
const LIVE_KB_CONTENT_FALLBACK = "No live knowledge base content.";
const ICON_SIZE_MEDIUM = 16;
const NOT_FOUND_INDEX = -1;
const TITLE_MAX_LENGTH = 250;

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

type PreviewFooterProperties = {
	approveLabel: string;
	canEdit: boolean;
	canSubmitReview: boolean;
	isApplying: boolean;
	isEditInvalid: boolean;
	isEditMode: boolean;
	onApprove: () => void;
	onCancelEdit: () => void;
	onClose: () => void;
	onEnterEdit: () => void;
	onSaveEdit: () => void;
	submitBlockedReason?: string | undefined;
};

type ProposedNodeType = ProposedPage["type"] | ProposedSection["type"];

type SectionContentEditorProperties = {
	content: string;
	isEditable?: boolean;
	onContentChange?: (content: string) => void;
};

type SectionDetailsProperties = {
	activeNodeType: ActiveNodeType;
	activePage: ProposedSection | undefined;
	activeSection: ProposedPage | undefined;
	isContentEmpty: boolean;
	isEditMode: boolean;
	isInteractionDisabled: boolean;
	isTitleEmpty: boolean;
	onContentChange: (content: string) => void;
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

const getSectionConflicts = (section: ProposedPage): FieldConflict[] => {
	if (section.status !== "conflict") {
		return [];
	}

	const liveTitle = section.originalTitle ?? section.title;
	const liveContent = section.originalContent ?? LIVE_KB_CONTENT_FALLBACK;
	const conflicts: FieldConflict[] = [];

	if (liveTitle !== section.title) {
		conflicts.push({
			changeId: section.integrationChangeId,
			currentValue: liveTitle,
			field: "title",
			id: `conf-title-${String(section.integrationChangeId)}`,
			incomingValue: section.title,
			matchedNodeId: section.matchedNodeId ?? null,
		});
	}

	if (liveContent !== section.content) {
		conflicts.push({
			changeId: section.integrationChangeId,
			currentValue: liveContent,
			field: "content",
			id: `conf-content-${String(section.integrationChangeId)}`,
			incomingValue: section.content,
			matchedNodeId: section.matchedNodeId ?? null,
		});
	}

	return conflicts;
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

const SectionContentEditor = ({
	content,
	isEditable = true,
	onContentChange,
}: SectionContentEditorProperties): JSX.Element => {
	const [initialContent] = useState<PartialBlock[]>(() =>
		textToBlocks(content),
	);

	const handleChange = useCallback(
		(blocks: EditorBlock[]): void => {
			onContentChange?.(blocksToText(blocks));
		},
		[onContentChange],
	);

	return (
		<KnowledgeEditor
			initialContent={initialContent}
			isEditable={isEditable}
			onChange={handleChange}
		/>
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
	const handleTitleChange = isParentSelected
		? onPageTitleChange
		: onTitleChange;

	return (
		<div className="flex flex-1 min-w-0 flex-col gap-3 p-3.5 tablet:p-6 tablet:overflow-y-auto">
			<div className="flex flex-col gap-2 border-b border-border-subtle pb-3">
				<div className="flex items-center justify-between gap-2">
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
				</div>
			)}

			{activeSection && !isParentSelected && (
				<div className="flex flex-1 min-w-0 flex-col gap-3">
					{isEditMode ? (
						<div className="flex flex-1 flex-col gap-1">
							<div
								className={getValidClassNames(
									"min-h-40 tablet:min-h-72 w-full flex-1 rounded-md border bg-surface p-3 tablet:p-4 transition-colors",
									isContentEmpty
										? "border-error"
										: "border-border focus:border-accent",
								)}
							>
								<SectionContentEditor
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
								content={activeSection.content}
								isEditable={false}
								key={editorKey}
							/>
						</div>
					)}
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

const IntegrationPreview: React.FC<IntegrationPreviewProperties> = ({
	errorMessage,
	failedPageNumbers = [],
	onAddMore,
	onApplyingChange,
	onApprove,
	onApproveExtraction,
	onClose,
	proposedStructure,
	variant = "integration",
}: IntegrationPreviewProperties): JSX.Element => {
	const initialStructure = proposedStructure;
	const isExtractionValidation = variant === "extraction-validation";

	const [pages, setPages] = useState<ProposedSection[]>(initialStructure);
	const [backupPages, setBackupPages] =
		useState<ProposedSection[]>(initialStructure);
	const [activePageIndex, setActivePageIndex] =
		useState<number>(DEFAULT_PAGE_INDEX);
	const [activeSectionIndex, setActiveSectionIndex] = useState<number>(
		DEFAULT_SECTION_INDEX,
	);
	const [activeNodeType, setActiveNodeType] = useState<ActiveNodeType>("child");
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
	const [isMergeScreenOpen, setIsMergeScreenOpen] = useState<boolean>(false);
	const [activeConflicts, setActiveConflicts] = useState<FieldConflict[]>([]);
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
		!isExtractionValidation ||
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

	const applyChanges = useCallback(
		async (conflicts: FieldConflict[]): Promise<void> => {
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
				isApplied = await onApprove(
					toConflictResolutions({ conflicts, sections: proposedStructure }),
				);
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
		[isApplying, onApprove, proposedStructure, setApplyingState],
	);

	const handleApproveExtraction = useCallback(async (): Promise<void> => {
		if (!onApproveExtraction || isApplying) {
			return;
		}

		setApplyingState(true);

		let isApplied: boolean;

		try {
			isApplied = await onApproveExtraction(pages);
		} catch {
			return;
		} finally {
			setApplyingState(false);
		}

		if (isApplied) {
			setIsSuccessModalOpen(true);
		}
	}, [isApplying, onApproveExtraction, pages, setApplyingState]);

	const handleApprove = useCallback((): void => {
		if (isApplying) {
			return;
		}

		if (isExtractionValidation) {
			void handleApproveExtraction();

			return;
		}

		const integrationConflicts = getAllIntegrationConflicts(pages);

		if (integrationConflicts.length === EMPTY_LENGTH) {
			void applyChanges([]);

			return;
		}

		setActiveConflicts(integrationConflicts);
		setIsMergeScreenOpen(true);
	}, [
		applyChanges,
		handleApproveExtraction,
		isApplying,
		isExtractionValidation,
		pages,
	]);

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

	const handleCancelMerge = useCallback((): void => {
		if (!isApplying) {
			setIsMergeScreenOpen(false);
		}
	}, [isApplying]);

	const handleConsolidatedPublish = useCallback(
		(
			resolvedPages: ProposedSection[],
			resolvedConflicts: FieldConflict[],
		): void => {
			setPages(resolvedPages);
			void applyChanges(resolvedConflicts);
		},
		[applyChanges],
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

	const handleSectionContentChange = useCallback(
		(newContent: string): void => {
			setPages((previousPages) =>
				updateSectionInPages({
					pageIndex: activePageIndex,
					pages: previousPages,
					partialSection: { content: newContent },
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

	const handleAddPage = useCallback((): void => {
		const newPageIndex = pages.length;

		setPages((previousPages) => addPageGroup(previousPages));
		setActivePageIndex(newPageIndex);
		setActiveNodeType("parent");
	}, [pages.length]);

	const handleAddSection = useCallback(
		(pageIndex: number): void => {
			const newSectionIndex =
				pages[pageIndex]?.pages.length ?? DEFAULT_SECTION_INDEX;

			setPages((previousPages) => addSectionToPage(previousPages, pageIndex));
			setActivePageIndex(pageIndex);
			setActiveSectionIndex(newSectionIndex);
			setActiveNodeType("child");
		},
		[pages],
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

	if (isMergeScreenOpen) {
		return (
			<>
				<MergeScreen
					conflicts={activeConflicts}
					isApplying={isApplying}
					onCancel={handleCancelMerge}
					onPublish={handleConsolidatedPublish}
					pages={pages}
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
	const approveLabel =
		isExtractionValidation && remainingExtractionItemCount === EMPTY_LENGTH
			? "Finish without publishing"
			: "Approve & save";
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
	const canSubmitReview = isExtractionValidation ? !hasBlankEntry : hasContent;
	const submitBlockedReason =
		isExtractionValidation && hasBlankEntry
			? "Every page and item needs a title and content before you can approve. Fill in or remove the blank ones."
			: undefined;

	return (
		<div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-between gap-3 p-3 tablet:p-4 pb-2 tablet:pb-4 font-sans text-text">
			{errorMessage && (
				<Alert
					description={errorMessage}
					title="Review could not be saved"
					variant="error"
				/>
			)}
			{isExtractionValidation && failedPageNumbers.length > EMPTY_LENGTH && (
				<Alert
					description={toFailedPagesMessage(failedPageNumbers)}
					title="Some pages could not be processed"
					variant="warning"
				/>
			)}
			<div className="flex flex-1 min-h-0 flex-col tablet:flex-row overflow-y-auto tablet:overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
				<StructureAside
					activeNodeType={activeNodeType}
					activePageIndex={activePageIndex}
					activeSectionIndex={activeSectionIndex}
					isExtractionValidation={isExtractionValidation}
					isInteractionDisabled={isApplying}
					onAddPage={handleAddPage}
					onAddSection={handleAddSection}
					onDeletePage={handleDeletePage}
					onDeleteSection={handleDeleteSection}
					onMovePage={handleMovePage}
					onMoveSection={handleMoveSection}
					onSelectPage={handleSelectPage}
					onSelectSection={handleSelectSection}
					pages={pages}
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
					onPageTitleChange={handlePageTitleChange}
					onRejectItem={handleRejectItem}
					onTitleChange={handleSectionTitleChange}
					showRejectItem={isExtractionValidation}
				/>
			</div>

			<PreviewFooter
				approveLabel={approveLabel}
				canEdit={canEnterEdit}
				canSubmitReview={canSubmitReview}
				isApplying={isApplying}
				isEditInvalid={isEditInvalid}
				isEditMode={isEditMode && canEditSelectedNode}
				onApprove={handleApprove}
				onCancelEdit={handleCancelEdit}
				onClose={onClose}
				onEnterEdit={handleEnterEdit}
				onSaveEdit={handleSaveEdit}
				submitBlockedReason={submitBlockedReason}
			/>

			<ProposedStructureSuccessModal
				isOpen={isSuccessModalOpen}
				onAddMore={handleAddMoreAndClose}
				onGoToKnowledgeBase={handleGoToKB}
			/>
		</div>
	);
};

export { IntegrationPreview };
