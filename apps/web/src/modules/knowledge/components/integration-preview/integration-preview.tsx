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
	Button,
	Heading,
	Icon,
	KnowledgeEditor,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { toConflictResolutions } from "~/modules/knowledge/libs/helpers/helpers.js";
import {
	type ChangeStatus,
	type FieldConflict,
	type IntegrationPreviewProperties,
	type ProposedPage,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

import { MergeScreen } from "./libs/components/merge-screen.js";
import { ProposedStructureSuccessModal } from "./libs/components/proposed-structure-success-modal.js";
import { DEFAULT_PAGE_INDEX, DEFAULT_SECTION_INDEX } from "./libs/constants.js";

const EMPTY_LENGTH = 0;
const LIVE_KB_CONTENT_FALLBACK = "No live knowledge base content.";
const ICON_SIZE_MEDIUM = 16;
const ICON_SIZE_SMALL = 14;
const TITLE_MAX_LENGTH = 250;

type ActiveNodeType = "child" | "parent";

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

type PreviewFooterProperties = {
	hasContent: boolean;
	isEditInvalid: boolean;
	isEditMode: boolean;
	onApprove: () => void;
	onCancelEdit: () => void;
	onClose: () => void;
	onEnterEdit: () => void;
	onSaveEdit: () => void;
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
	isTitleEmpty: boolean;
	onContentChange: (content: string) => void;
	onPageTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type StructureAsideProperties = {
	activeNodeType: ActiveNodeType;
	activePageIndex: number;
	activeSectionIndex: number;
	onSelectPage: (event: MouseEvent<HTMLButtonElement>) => void;
	onSelectSection: (event: MouseEvent<HTMLButtonElement>) => void;
	pages: ProposedSection[];
};

type TextContentItem = {
	text?: unknown;
};

type UpdatePageParameters = {
	pageIndex: number;
	pages: ProposedSection[];
	partialPage: Partial<ProposedSection>;
};

type UpdateSectionParameters = {
	pageIndex: number;
	pages: ProposedSection[];
	partialSection: Partial<ProposedPage>;
	sectionIndex: number;
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

	if (!Array.isArray(content)) {
		return "";
	}

	return content
		.map((item) => {
			if (typeof item === "string") {
				return item;
			}

			if (isTextContentItem(item)) {
				const { text } = item;

				return typeof text === "string" ? text : "";
			}

			return "";
		})
		.join("");
};

const blocksToText = (blocks: readonly EditorBlock[]): string => {
	return blocks
		.map((block) => getInlineText(block.content))
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

const formatChangeStatusLabel = (status: ChangeStatus): string => status;

const getStatusBadge = (status: ChangeStatus): JSX.Element => {
	const isConflict = status === "conflict";
	const isCreated = status === "created";
	const isDuplicate = status === "duplicate";
	const isModified = status === "modified";

	const badgeClass = getValidClassNames(
		"inline-flex items-center justify-center min-w-[64px] rounded-full px-2 py-0.5 font-sans text-2xs font-medium lowercase tracking-wide shrink-0 border transition-colors text-center leading-none whitespace-nowrap",
		{
			"bg-error-bg text-error border-error/25": isConflict,
			"bg-info-bg text-info border-info/25": isModified,
			"bg-secondary text-text-muted border-border": isDuplicate,
			"bg-success-bg text-accent border-accent/25": isCreated,
		},
	);

	return <span className={badgeClass}>{formatChangeStatusLabel(status)}</span>;
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

const updateSectionInPages = ({
	pageIndex,
	pages,
	partialSection,
	sectionIndex,
}: UpdateSectionParameters): ProposedSection[] => {
	const updatedPages = [...pages];
	const targetPage = updatedPages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	const updatedSections = [...targetPage.pages];
	const targetSection = updatedSections[sectionIndex];

	if (!targetSection) {
		return pages;
	}

	updatedSections[sectionIndex] = {
		...targetSection,
		...partialSection,
		status:
			targetSection.status === "created" ? targetSection.status : "modified",
	};

	updatedPages[pageIndex] = {
		...targetPage,
		pages: updatedSections,
		status: targetPage.status === "created" ? targetPage.status : "modified",
	};

	return updatedPages;
};

const updatePageInPages = ({
	pageIndex,
	pages,
	partialPage,
}: UpdatePageParameters): ProposedSection[] => {
	const targetPage = pages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	const updatedPages = [...pages];

	updatedPages[pageIndex] = {
		...targetPage,
		...partialPage,
		status: targetPage.status === "created" ? targetPage.status : "modified",
	};

	return updatedPages;
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

const StructureAside = ({
	activeNodeType,
	activePageIndex,
	activeSectionIndex,
	onSelectPage,
	onSelectSection,
	pages,
}: StructureAsideProperties): JSX.Element => (
	<aside className="flex shrink-0 flex-col gap-3 border-b tablet:border-b-0 tablet:border-r border-border-subtle p-3.5 tablet:p-5 tablet:overflow-y-auto w-full tablet:w-80 tablet:min-w-[320px] tablet:max-w-[320px]">
		<div className="font-sans text-2xs font-bold uppercase tracking-wider text-text-muted">
			Proposed Structure
		</div>

		<div className="flex w-full min-w-0 flex-col gap-3">
			{pages.map((page, pageIndex) => {
				const isPageSelected =
					pageIndex === activePageIndex && activeNodeType === "parent";

				return (
					<div className="flex w-full min-w-0 flex-col gap-1" key={page.id}>
						<button
							className={getValidClassNames(
								"group flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md py-1.5 pl-1.5 pr-1.5 text-left font-sans text-xs font-semibold transition-colors",
								isPageSelected
									? "bg-success-bg text-accent"
									: "text-text hover:bg-secondary",
							)}
							data-page-index={pageIndex}
							onClick={onSelectPage}
							type="button"
						>
							<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
								<div
									className={getValidClassNames(
										"shrink-0 flex items-center justify-center transition-colors",
										isPageSelected
											? "text-accent"
											: "text-text-muted group-hover:text-text",
									)}
								>
									<Icon name="paragraph" size={ICON_SIZE_SMALL} />
								</div>
								<span className="truncate block min-w-0 flex-1">
									{page.title}
								</span>
							</div>
							{getStatusBadge(page.status)}
						</button>

						<div className="flex w-full min-w-0 flex-col gap-0.5">
							{page.pages.map((section, sectionIndex) => {
								const isSelected =
									pageIndex === activePageIndex &&
									sectionIndex === activeSectionIndex &&
									activeNodeType === "child";
								const sectionTitle =
									section.title.trim().length > EMPTY_LENGTH
										? section.title
										: "Untitled section";

								return (
									<button
										className={getValidClassNames(
											"group flex w-full min-w-0 cursor-pointer items-center justify-between overflow-hidden rounded-md py-1.5 pl-4 pr-1.5 text-left font-sans text-xs transition-colors",
											isSelected
												? "bg-success-bg font-medium text-accent"
												: "text-text-muted hover:bg-secondary hover:text-text",
										)}
										data-page-index={pageIndex}
										data-section-index={sectionIndex}
										key={section.id}
										onClick={onSelectSection}
										type="button"
									>
										<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
											<div
												className={getValidClassNames(
													"shrink-0 flex items-center justify-center transition-colors",
													isSelected
														? "text-accent"
														: "text-control-inactive group-hover:text-text-muted",
												)}
											>
												<Icon name="file" size={ICON_SIZE_SMALL} />
											</div>
											<span className="truncate block min-w-0 flex-1">
												{sectionTitle}
											</span>
										</div>
										{getStatusBadge(section.status)}
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	</aside>
);

const SectionDetails = ({
	activeNodeType,
	activePage,
	activeSection,
	isContentEmpty,
	isEditMode,
	isTitleEmpty,
	onContentChange,
	onPageTitleChange,
	onTitleChange,
}: SectionDetailsProperties): JSX.Element => {
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
		</div>
	);
};

const PreviewFooter = ({
	hasContent,
	isEditInvalid,
	isEditMode,
	onApprove,
	onCancelEdit,
	onClose,
	onEnterEdit,
	onSaveEdit,
}: PreviewFooterProperties): JSX.Element => (
	<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-2 px-1">
		{isEditMode ? (
			<div className="flex w-full tablet:w-auto items-center justify-between tablet:justify-start gap-2 tablet:gap-3">
				<Button
					className="flex-1 tablet:flex-initial tablet:w-auto"
					onClick={onCancelEdit}
					variant="secondary"
				>
					Cancel
				</Button>
				<Button
					className="flex-1 tablet:flex-initial tablet:w-auto"
					disabled={isEditInvalid}
					onClick={onSaveEdit}
					variant="primary"
				>
					Save
				</Button>
			</div>
		) : (
			<>
				<Button
					disabled={!hasContent}
					onClick={onEnterEdit}
					variant="secondary"
				>
					Edit
				</Button>

				<div className="flex items-center justify-end gap-2">
					<Button onClick={onClose} variant="secondary">
						Back
					</Button>
					<Button disabled={!hasContent} onClick={onApprove} variant="primary">
						<Icon name="checkbox-tick" size={ICON_SIZE_MEDIUM} />
						<span>Approve & save</span>
					</Button>
				</div>
			</>
		)}
	</div>
);

const IntegrationPreview: React.FC<IntegrationPreviewProperties> = ({
	onAddMore,
	onApprove,
	onClose,
	proposedStructure,
}: IntegrationPreviewProperties): JSX.Element => {
	const initialStructure = proposedStructure;

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

	const activePage = pages[activePageIndex] ?? pages[DEFAULT_PAGE_INDEX];
	const activeSection =
		activePage?.pages[activeSectionIndex] ??
		activePage?.pages[DEFAULT_SECTION_INDEX];
	const selectedNode = activeNodeType === "parent" ? activePage : activeSection;

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

			setIsApplying(true);

			const isApplied = await onApprove(
				toConflictResolutions({ conflicts, sections: proposedStructure }),
			);

			setIsApplying(false);

			if (isApplied) {
				setIsMergeScreenOpen(false);
				setIsSuccessModalOpen(true);
			}
		},
		[isApplying, onApprove, proposedStructure],
	);

	const handleApprove = useCallback((): void => {
		const integrationConflicts = getAllIntegrationConflicts(pages);

		if (integrationConflicts.length === EMPTY_LENGTH) {
			void applyChanges([]);

			return;
		}

		setActiveConflicts(integrationConflicts);
		setIsMergeScreenOpen(true);
	}, [applyChanges, pages]);

	const handleCancelEdit = useCallback((): void => {
		setPages(backupPages);
		setIsEditMode(false);
	}, [backupPages]);

	const handleCancelMerge = useCallback((): void => {
		setIsMergeScreenOpen(false);
	}, []);

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
		setBackupPages(pages);
		setIsEditMode(true);
	}, [pages]);

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

	if (isMergeScreenOpen) {
		return (
			<>
				<MergeScreen
					conflicts={activeConflicts}
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

	return (
		<div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-between gap-3 p-3 tablet:p-4 pb-2 tablet:pb-4 font-sans text-text">
			<div className="flex flex-1 min-h-0 flex-col tablet:flex-row overflow-y-auto tablet:overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
				<StructureAside
					activeNodeType={activeNodeType}
					activePageIndex={activePageIndex}
					activeSectionIndex={activeSectionIndex}
					onSelectPage={handleSelectPage}
					onSelectSection={handleSelectSection}
					pages={pages}
				/>

				<SectionDetails
					activeNodeType={activeNodeType}
					activePage={activePage}
					activeSection={activeSection}
					isContentEmpty={isContentEmpty}
					isEditMode={isEditMode}
					isTitleEmpty={isTitleEmpty}
					onContentChange={handleSectionContentChange}
					onPageTitleChange={handlePageTitleChange}
					onTitleChange={handleSectionTitleChange}
				/>
			</div>

			<PreviewFooter
				hasContent={hasContent}
				isEditInvalid={isEditInvalid}
				isEditMode={isEditMode}
				onApprove={handleApprove}
				onCancelEdit={handleCancelEdit}
				onClose={onClose}
				onEnterEdit={handleEnterEdit}
				onSaveEdit={handleSaveEdit}
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
