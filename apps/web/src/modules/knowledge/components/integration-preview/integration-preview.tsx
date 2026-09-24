import {
	type Block,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
	type PartialBlock,
} from "@blocknote/core";
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
import {
	type ChangeStatus,
	type FieldConflict,
	type IntegrationPreviewProperties,
	type ProposedNodeType,
	type ProposedPage,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

import { MergeScreen } from "./libs/components/merge-screen.js";
import { ProposedStructureSuccessModal } from "./libs/components/proposed-structure-success-modal.js";
import {
	DEFAULT_PAGE_INDEX,
	DEFAULT_PROPOSED_STRUCTURE,
	DEFAULT_SECTION_INDEX,
} from "./libs/constants.js";

const DEFAULT_BASELINE = 1;
const EMPTY_LENGTH = 0;
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

type SectionContentEditorProperties = {
	content: string;
	isEditable?: boolean;
	onContentChange?: (content: string) => void;
};

type SectionDetailsProperties = {
	activeNodeType: ActiveNodeType;
	activePage: ProposedPage | undefined;
	activeSection: ProposedSection | undefined;
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
	pages: ProposedPage[];
};

type UpdatePageParameters = {
	pageIndex: number;
	pages: ProposedPage[];
	partialPage: Partial<ProposedPage>;
};

type UpdateSectionParameters = {
	pageIndex: number;
	pages: ProposedPage[];
	partialSection: Partial<ProposedSection>;
	sectionIndex: number;
};

const getNodeTypeLabel = (
	type: ProposedNodeType | undefined,
	fallbackLabel: string,
): string => {
	if (type === "ENTRY") {
		return "Entry";
	}

	if (type === "SECTION") {
		return "Section";
	}

	if (type === "PAGE") {
		return "Page";
	}

	return fallbackLabel;
};

const getNodeTitleLabel = (
	type: ProposedNodeType | undefined,
	fallbackLabel: string,
): string => `${getNodeTypeLabel(type, fallbackLabel)} title`;

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

			if (typeof item === "object" && item !== null) {
				const text = (item as Record<string, unknown>)["text"];

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

const getStatusLabel = (status: ChangeStatus): string => {
	if (status === "NEW") {
		return "new";
	}

	if (status === "UPDATE") {
		return "update";
	}

	if (status === "DUPLICATE") {
		return "duplicate";
	}

	return "conflict";
};

const getSectionStatusLabel = (status: ChangeStatus): string => {
	if (status === "NEW") {
		return "new section";
	}

	if (status === "UPDATE") {
		return "updated section";
	}

	if (status === "DUPLICATE") {
		return "duplicate section";
	}

	return "conflict section";
};

const getStatusBadge = (status: ChangeStatus): JSX.Element => {
	const isConflict = status === "CONFLICT";
	const isDuplicate = status === "DUPLICATE";
	const isNew = status === "NEW";
	const isUpdate = status === "UPDATE";

	const badgeClass = getValidClassNames(
		"inline-flex items-center justify-center min-w-[64px] rounded-full px-2 py-0.5 font-sans text-2xs font-medium lowercase tracking-wide shrink-0 border transition-colors text-center leading-none whitespace-nowrap",
		{
			"bg-error-bg text-error border-error/25": isConflict,
			"bg-info-bg text-info border-info/25": isUpdate,
			"bg-secondary text-text-muted border-border": isDuplicate,
			"bg-success-bg text-accent border-accent/25": isNew,
		},
	);

	return <span className={badgeClass}>{getStatusLabel(status)}</span>;
};

const getSectionConflicts = (section: ProposedSection): FieldConflict[] => {
	if (section.status !== "CONFLICT") {
		return [];
	}

	return [
		{
			currentValue: section.originalTitle ?? section.title,
			field: "title",
			id: `conf-title-${section.id}`,
			incomingValue: section.title,
		},
		{
			currentValue:
				section.originalContent ?? "Initial base version in Live KB",
			field: "content",
			id: `conf-content-${section.id}`,
			incomingValue: section.content,
		},
	];
};

const getGeneratedConflicts = (
	pages: ProposedPage[],
	activeSection: ProposedSection | undefined,
): FieldConflict[] => {
	const generatedConflicts: FieldConflict[] = [];

	for (const page of pages) {
		for (const section of page.sections) {
			generatedConflicts.push(...getSectionConflicts(section));
		}
	}

	if (
		activeSection &&
		activeSection.status !== "NEW" &&
		generatedConflicts.length === EMPTY_LENGTH
	) {
		const { content, id, originalContent, originalTitle, title } =
			activeSection;

		generatedConflicts.push(
			{
				currentValue: originalTitle ?? title,
				field: "title",
				id: `conf-default-title-${id}`,
				incomingValue: title,
			},
			{
				currentValue: originalContent ?? "Initial base version in Live KB",
				field: "content",
				id: `conf-default-content-${id}`,
				incomingValue: content,
			},
		);
	}

	return generatedConflicts;
};

const updateSectionInPages = ({
	pageIndex,
	pages,
	partialSection,
	sectionIndex,
}: UpdateSectionParameters): ProposedPage[] => {
	const updatedPages = [...pages];
	const targetPage = updatedPages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	const updatedSections = [...targetPage.sections];
	const targetSection = updatedSections[sectionIndex];

	if (!targetSection) {
		return pages;
	}

	updatedSections[sectionIndex] = {
		...targetSection,
		...partialSection,
		status:
			targetSection.status === "NEW" ? targetSection.status : "UPDATE",
	};

	updatedPages[pageIndex] = {
		...targetPage,
		sections: updatedSections,
		status: targetPage.status === "NEW" ? targetPage.status : "UPDATE",
	};

	return updatedPages;
};

const updatePageInPages = ({
	pageIndex,
	pages,
	partialPage,
}: UpdatePageParameters): ProposedPage[] => {
	const targetPage = pages[pageIndex];

	if (!targetPage) {
		return pages;
	}

	const updatedPages = [...pages];

	updatedPages[pageIndex] = {
		...targetPage,
		...partialPage,
		status: targetPage.status === "NEW" ? targetPage.status : "UPDATE",
	};

	return updatedPages;
};

const SectionContentEditor = ({
	content,
	isEditable = true,
	onContentChange,
}: SectionContentEditorProperties): JSX.Element => {
	const [initialContent] = useState<PartialBlock[]>(() => textToBlocks(content));

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
								"group flex w-full min-w-0 items-center justify-between gap-2 rounded-md py-1.5 pl-1.5 pr-1.5 text-left font-sans text-xs font-semibold transition-colors",
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
							{page.sections.map((section, sectionIndex) => {
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
											"group flex w-full min-w-0 items-center justify-between overflow-hidden rounded-md py-1.5 pl-4 pr-1.5 text-left font-sans text-xs transition-colors",
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
			<main className="flex flex-1 min-w-0 flex-col gap-3 p-3.5 tablet:p-6 tablet:overflow-y-auto">
				<Paragraph size={ParagraphSize.BODY_SMALL}>
					Select a node from the proposed tree to view details.
				</Paragraph>
			</main>
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
		<main className="flex flex-1 min-w-0 flex-col gap-3 p-3.5 tablet:p-6 tablet:overflow-y-auto">
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
									selectedNode.status === "UPDATE",
								"bg-secondary text-text-muted border-border":
									selectedNode.status === "DUPLICATE",
								"bg-success-bg text-accent border-accent/25":
									selectedNode.status === "NEW",
								"bg-warning-bg text-warning border-warning/35":
									selectedNode.status === "CONFLICT",
							},
						)}
					>
						{getSectionStatusLabel(selectedNode.status)}
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
							This section groups proposed pages. Select a page to edit its
							content.
						</Paragraph>
					</div>
				</div>
			)}
		</main>
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
	baselineVersion = DEFAULT_BASELINE,
	currentLiveVersion = DEFAULT_BASELINE,
	onAddMore,
	onApprove,
	onClose,
	proposedStructure,
}: IntegrationPreviewProperties): JSX.Element => {
	const initialStructure =
		proposedStructure && proposedStructure.length > EMPTY_LENGTH
			? proposedStructure
			: DEFAULT_PROPOSED_STRUCTURE;

	const [pages, setPages] = useState<ProposedPage[]>(initialStructure);
	const [backupPages, setBackupPages] =
		useState<ProposedPage[]>(initialStructure);
	const [activePageIndex, setActivePageIndex] =
		useState<number>(DEFAULT_PAGE_INDEX);
	const [activeSectionIndex, setActiveSectionIndex] = useState<number>(
		DEFAULT_SECTION_INDEX,
	);
	const [activeNodeType, setActiveNodeType] =
		useState<ActiveNodeType>("child");
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
	const [isMergeScreenOpen, setIsMergeScreenOpen] = useState<boolean>(false);
	const [activeConflicts, setActiveConflicts] = useState<FieldConflict[]>([]);

	const activePage = pages[activePageIndex] ?? pages[DEFAULT_PAGE_INDEX];
	const activeSection =
		activePage?.sections[activeSectionIndex] ??
		activePage?.sections[DEFAULT_SECTION_INDEX];
	const selectedNode =
		activeNodeType === "parent" ? activePage : activeSection;

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

	const handleApprove = useCallback((): void => {
		const hasVersionMismatch = currentLiveVersion !== baselineVersion;

		if (!hasVersionMismatch) {
			onApprove(pages);
			setIsSuccessModalOpen(true);

			return;
		}

		const generatedConflicts = getGeneratedConflicts(pages, activeSection);
		setActiveConflicts(generatedConflicts);
		setIsMergeScreenOpen(true);
	}, [activeSection, baselineVersion, currentLiveVersion, onApprove, pages]);

	const handleCancelEdit = useCallback((): void => {
		setPages(backupPages);
		setIsEditMode(false);
	}, [backupPages]);

	const handleCancelMerge = useCallback((): void => {
		setIsMergeScreenOpen(false);
	}, []);

	const handleConsolidatedPublish = useCallback(
		(resolvedPages: ProposedPage[]): void => {
			setPages(resolvedPages);
			setIsMergeScreenOpen(false);
			onApprove(resolvedPages);
			setIsSuccessModalOpen(true);
		},
		[onApprove],
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
			const pageIndexString = event.currentTarget.dataset["pageIndex"];

			if (pageIndexString !== undefined) {
				setActivePageIndex(Number(pageIndexString));
				setActiveNodeType("parent");
			}
		},
		[],
	);

	const handleSelectSection = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const target = event.currentTarget;
			const pageIndexString = target.dataset["pageIndex"];
			const sectionIndexString = target.dataset["sectionIndex"];

			if (pageIndexString !== undefined && sectionIndexString !== undefined) {
				setActivePageIndex(Number(pageIndexString));
				setActiveSectionIndex(Number(sectionIndexString));
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
