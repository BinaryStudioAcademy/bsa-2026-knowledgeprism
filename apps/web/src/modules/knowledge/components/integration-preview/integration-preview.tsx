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
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import {
	type ChangeStatus,
	type FieldConflict,
	type IntegrationPreviewProperties,
	type ProposedPage,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

import { MergeScreen } from "./libs/components/merge-screen.js";
import { SuccessModal } from "./libs/components/success-modal.js";
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

type SectionDetailsProperties = {
	activePageTitle: string;
	activeSection: ProposedSection | undefined;
	isContentEmpty: boolean;
	isEditMode: boolean;
	isTitleEmpty: boolean;
	onContentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
	onTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type StructureAsideProperties = {
	activePageIndex: number;
	activeSectionIndex: number;
	onSelectSection: (event: MouseEvent<HTMLButtonElement>) => void;
	pages: ProposedPage[];
};

type UpdateSectionParameters = {
	pageIndex: number;
	pages: ProposedPage[];
	partialSection: Partial<ProposedSection>;
	sectionIndex: number;
};

const getStatusLabel = (status: ChangeStatus): string => {
	if (status === "created") {
		return "created";
	}

	if (status === "modified") {
		return "modified";
	}

	return "updated";
};

const getSectionStatusLabel = (status: ChangeStatus): string => {
	if (status === "created") {
		return "created section";
	}

	if (status === "modified") {
		return "modified section";
	}

	return "updated section";
};

const getStatusBadge = (status: ChangeStatus): JSX.Element => {
	const isCreated = status === "created";
	const isModified = status === "modified";

	const badgeClass = getValidClassNames(
		"inline-flex items-center justify-center min-w-[64px] rounded-full px-2 py-0.5 font-sans text-2xs font-medium lowercase tracking-wide shrink-0 border transition-colors text-center leading-none whitespace-nowrap",
		{
			"bg-info-bg text-info border-info/25": isModified,
			"bg-success-bg text-accent border-accent/25": isCreated,
			"bg-warning-bg text-warning border-warning/35": !isCreated && !isModified,
		},
	);

	return <span className={badgeClass}>{getStatusLabel(status)}</span>;
};

const getSectionConflicts = (section: ProposedSection): FieldConflict[] => {
	if (section.status !== "modified") {
		return [];
	}

	return [
		{
			currentValue: section.title,
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

	if (activeSection && generatedConflicts.length === EMPTY_LENGTH) {
		const { content, id, originalContent, title } = activeSection;

		generatedConflicts.push(
			{
				currentValue: title,
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
		status: "modified",
	};

	updatedPages[pageIndex] = {
		...targetPage,
		sections: updatedSections,
	};

	return updatedPages;
};

const StructureAside = ({
	activePageIndex,
	activeSectionIndex,
	onSelectSection,
	pages,
}: StructureAsideProperties): JSX.Element => (
	<aside className="flex shrink-0 flex-col gap-3 border-b tablet:border-b-0 tablet:border-r border-border-subtle p-3.5 tablet:p-5 tablet:overflow-y-auto w-full tablet:w-80 tablet:min-w-[320px] tablet:max-w-[320px]">
		<div className="font-sans text-2xs font-bold uppercase tracking-wider text-text-muted">
			Proposed Structure
		</div>

		<div className="flex w-full min-w-0 flex-col gap-3">
			{pages.map((page, pageIndex) => (
				<div className="flex w-full min-w-0 flex-col gap-1" key={page.id}>
					<div className="flex w-full min-w-0 items-center justify-between gap-2 py-1 pl-1.5 pr-1.5 font-sans text-xs font-semibold text-text">
						<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
							<div className="shrink-0 flex items-center justify-center text-text-muted">
								<Icon name="paragraph" size={ICON_SIZE_SMALL} />
							</div>
							<span className="truncate block min-w-0 flex-1">
								{page.title}
							</span>
						</div>
						{getStatusBadge(page.status)}
					</div>

					<div className="flex w-full min-w-0 flex-col gap-0.5">
						{page.sections.map((section, sectionIndex) => {
							const isSelected =
								pageIndex === activePageIndex &&
								sectionIndex === activeSectionIndex;
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
			))}
		</div>
	</aside>
);

const SectionDetails = ({
	activePageTitle,
	activeSection,
	isContentEmpty,
	isEditMode,
	isTitleEmpty,
	onContentChange,
	onTitleChange,
}: SectionDetailsProperties): JSX.Element => {
	if (!activeSection) {
		return (
			<main className="flex flex-1 min-w-0 flex-col gap-3 p-3.5 tablet:p-6 tablet:overflow-y-auto">
				<Paragraph size={ParagraphSize.BODY_SMALL}>
					Select a section from the proposed tree to view details.
				</Paragraph>
			</main>
		);
	}

	const currentTitle =
		activeSection.title.trim().length > EMPTY_LENGTH
			? activeSection.title
			: "Untitled section";

	return (
		<main className="flex flex-1 min-w-0 flex-col gap-3 p-3.5 tablet:p-6 tablet:overflow-y-auto">
			<div className="flex flex-col gap-2 border-b border-border-subtle pb-3">
				<div className="flex items-center justify-between gap-2">
					<span className="font-mono text-2xs uppercase tracking-wide text-text-muted truncate block min-w-0 flex-1">
						{activePageTitle} &gt; {currentTitle}
					</span>

					<span
						className={getValidClassNames(
							"rounded-full px-2.5 py-0.5 font-sans text-2xs font-medium border shrink-0 whitespace-nowrap",
							{
								"bg-info-bg text-info border-info/25":
									activeSection.status === "modified",
								"bg-success-bg text-accent border-accent/25":
									activeSection.status === "created",
								"bg-warning-bg text-warning border-warning/35":
									activeSection.status === "updated",
							},
						)}
					>
						{getSectionStatusLabel(activeSection.status)}
					</span>
				</div>

				{isEditMode ? (
					<div className="flex w-full flex-col gap-1">
						<input
							className={getValidClassNames(
								"w-full min-w-0 rounded-md border bg-surface px-3 py-1.5 font-serif text-base tablet:text-lg font-bold text-text transition-colors focus:outline-none",
								isTitleEmpty
									? "border-error focus:border-error"
									: "border-border focus:border-accent",
							)}
							maxLength={TITLE_MAX_LENGTH}
							onChange={onTitleChange}
							placeholder="Enter section title..."
							value={activeSection.title}
						/>
						<div className="flex items-center justify-between text-2xs font-sans">
							{isTitleEmpty ? (
								<span className="text-error font-medium">
									Title cannot be empty
								</span>
							) : (
								<span />
							)}
							<span className="text-text-faint">
								{activeSection.title.length}/{TITLE_MAX_LENGTH}
							</span>
						</div>
					</div>
				) : (
					<Heading
						className="font-serif text-lg tablet:text-h2 font-bold tracking-tight text-text"
						level="1"
					>
						{activeSection.title}
					</Heading>
				)}
			</div>

			<div className="flex flex-1 min-w-0 flex-col gap-3">
				{isEditMode ? (
					<div className="flex flex-1 flex-col gap-1">
						<textarea
							className={getValidClassNames(
								"min-h-40 tablet:min-h-72 w-full flex-1 rounded-md border bg-surface p-3 tablet:p-4 font-sans text-sm leading-relaxed text-text transition-colors focus:outline-none",
								isContentEmpty
									? "border-error focus:border-error"
									: "border-border focus:border-accent",
							)}
							onChange={onContentChange}
							placeholder="Enter section content..."
							value={activeSection.content}
						/>
						{isContentEmpty && (
							<span className="text-error font-sans text-2xs font-medium">
								Content cannot be empty
							</span>
						)}
					</div>
				) : (
					<div className="min-h-48 tablet:min-h-80 flex-1 rounded-md border border-border-subtle bg-bg p-3.5 tablet:p-5">
						<div className="whitespace-pre-line font-sans text-sm leading-relaxed text-text">
							{activeSection.content}
						</div>
					</div>
				)}
			</div>
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
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
	const [isMergeScreenOpen, setIsMergeScreenOpen] = useState<boolean>(false);
	const [activeConflicts, setActiveConflicts] = useState<FieldConflict[]>([]);

	const activePage = pages[activePageIndex] ?? pages[DEFAULT_PAGE_INDEX];
	const activeSection =
		activePage?.sections[activeSectionIndex] ??
		activePage?.sections[DEFAULT_SECTION_INDEX];

	const isTitleEmpty =
		(activeSection?.title.trim().length ?? EMPTY_LENGTH) === EMPTY_LENGTH;
	const isContentEmpty =
		(activeSection?.content.trim().length ?? EMPTY_LENGTH) === EMPTY_LENGTH;
	const isEditInvalid = isTitleEmpty || isContentEmpty;

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
		(event: ChangeEvent<HTMLTextAreaElement>): void => {
			const newContent = event.target.value;
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

	const handleSelectSection = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const target = event.currentTarget;
			const pageIndexString = target.dataset["pageIndex"];
			const sectionIndexString = target.dataset["sectionIndex"];

			if (pageIndexString !== undefined && sectionIndexString !== undefined) {
				setActivePageIndex(Number(pageIndexString));
				setActiveSectionIndex(Number(sectionIndexString));
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
				<SuccessModal
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
					activePageIndex={activePageIndex}
					activeSectionIndex={activeSectionIndex}
					onSelectSection={handleSelectSection}
					pages={pages}
				/>

				<SectionDetails
					activePageTitle={activePage?.title ?? ""}
					activeSection={activeSection}
					isContentEmpty={isContentEmpty}
					isEditMode={isEditMode}
					isTitleEmpty={isTitleEmpty}
					onContentChange={handleSectionContentChange}
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

			<SuccessModal
				isOpen={isSuccessModalOpen}
				onAddMore={handleAddMoreAndClose}
				onGoToKnowledgeBase={handleGoToKB}
			/>
		</div>
	);
};

export { IntegrationPreview };
