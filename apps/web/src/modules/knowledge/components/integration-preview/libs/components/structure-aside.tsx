import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type JSX, type MouseEvent, useCallback } from "react";

import { Icon } from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import {
	type ActiveNodeType,
	type ChangeStatus,
	type PlacementTarget,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

import { SectionRowMenu } from "./section-row-menu.js";

const EMPTY_LENGTH = 0;
const EMPTY_DROP_ZONE_ID_PREFIX = "empty-drop-";
const ICON_SIZE_SMALL = 14;
const ICON_SIZE_TINY = 11;
const POINTER_ACTIVATION_DISTANCE = 4;

type DragEntityType = "page" | "section";

type StructureAsideProperties = {
	activeNodeType: ActiveNodeType;
	activePageIndex: number;
	activeSectionIndex: number;
	isExtractionValidation: boolean;
	isInteractionDisabled: boolean;
	onDeletePage: (pageIndex: number) => void;
	onDeleteSection: (pageIndex: number, sectionIndex: number) => void;
	onMovePage: (activeId: string, overId: string) => void;
	onMoveSection: (activeId: string, overId: string) => void;
	onMoveSectionTo: (
		pageIndex: number,
		sectionIndex: number,
		targetId: null | number,
	) => void;
	onRenameSection: (pageIndex: number, sectionIndex: number) => void;
	onSelectPage: (event: MouseEvent<HTMLButtonElement>) => void;
	onSelectSection: (event: MouseEvent<HTMLButtonElement>) => void;
	pages: ProposedSection[];
	placementTargets: PlacementTarget[];
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

const EmptyPageDropZone = ({ pageId }: { pageId: string }): JSX.Element => {
	const { isOver, setNodeRef } = useDroppable({
		id: `${EMPTY_DROP_ZONE_ID_PREFIX}${pageId}`,
	});

	return (
		<div
			className={getValidClassNames(
				"rounded-md border border-dashed py-2 pl-4 pr-1.5 font-sans text-2xs text-text-faint transition-colors",
				isOver ? "border-accent bg-success-bg text-accent" : "border-border",
			)}
			ref={setNodeRef}
		>
			Drop an item here
		</div>
	);
};

const SortablePageHeader = ({
	isInteractionDisabled,
	isPageSelected,
	isReorderable,
	onDeletePage,
	onSelectPage,
	page,
	pageIndex,
}: {
	isInteractionDisabled: boolean;
	isPageSelected: boolean;
	isReorderable: boolean;
	onDeletePage: (pageIndex: number) => void;
	onSelectPage: (event: MouseEvent<HTMLButtonElement>) => void;
	page: ProposedSection;
	pageIndex: number;
}): JSX.Element => {
	const {
		attributes,
		isDragging,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({
		data: { type: "page" satisfies DragEntityType },
		disabled: !isReorderable || isInteractionDisabled,
		id: page.id,
	});
	const handleDeleteClick = useCallback((): void => {
		onDeletePage(pageIndex);
	}, [onDeletePage, pageIndex]);

	return (
		<div
			className={getValidClassNames(
				"flex w-full min-w-0 items-center gap-1",
				isDragging ? "opacity-50" : "",
			)}
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition ?? undefined,
			}}
		>
			{isReorderable && (
				<button
					aria-label="Reorder page"
					className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-1 text-text-faint hover:bg-secondary hover:text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
					disabled={isInteractionDisabled}
					type="button"
					{...attributes}
					{...listeners}
				>
					<Icon name="drag-handle" size={ICON_SIZE_SMALL} />
				</button>
			)}

			<button
				className={getValidClassNames(
					"group flex w-full min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-md py-1.5 pl-1.5 pr-1.5 text-left font-sans text-xs font-semibold transition-colors",
					isPageSelected
						? "bg-success-bg text-accent"
						: "text-text hover:bg-secondary",
				)}
				data-page-index={pageIndex}
				disabled={isInteractionDisabled}
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
					<span className="truncate block min-w-0 flex-1">{page.title}</span>
				</div>
				{getStatusBadge(page.status)}
			</button>

			{isReorderable && (
				<button
					aria-label="Delete page"
					className="flex shrink-0 items-center justify-center rounded p-1 text-text-faint hover:bg-error-bg hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
					disabled={isInteractionDisabled}
					onClick={handleDeleteClick}
					type="button"
				>
					<Icon name="close" size={ICON_SIZE_TINY} />
				</button>
			)}
		</div>
	);
};

const SortableSectionRow = ({
	isInteractionDisabled,
	isReorderable,
	isSelected,
	onDeleteSection,
	onMoveSectionTo,
	onRenameSection,
	onSelectSection,
	pageIndex,
	placementTargets,
	section,
	sectionIndex,
}: {
	isInteractionDisabled: boolean;
	isReorderable: boolean;
	isSelected: boolean;
	onDeleteSection: (pageIndex: number, sectionIndex: number) => void;
	onMoveSectionTo: (
		pageIndex: number,
		sectionIndex: number,
		targetId: null | number,
	) => void;
	onRenameSection: (pageIndex: number, sectionIndex: number) => void;
	onSelectSection: (event: MouseEvent<HTMLButtonElement>) => void;
	pageIndex: number;
	placementTargets: PlacementTarget[];
	section: ProposedSection["pages"][number];
	sectionIndex: number;
}): JSX.Element => {
	const {
		attributes,
		isDragging,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({
		data: { type: "section" satisfies DragEntityType },
		disabled: !isReorderable || isInteractionDisabled,
		id: section.id,
	});
	const sectionTitle =
		section.title.trim().length > EMPTY_LENGTH
			? section.title
			: "Untitled section";
	const handleDeleteClick = useCallback((): void => {
		onDeleteSection(pageIndex, sectionIndex);
	}, [onDeleteSection, pageIndex, sectionIndex]);
	const handleRename = useCallback((): void => {
		onRenameSection(pageIndex, sectionIndex);
	}, [onRenameSection, pageIndex, sectionIndex]);
	const handleMoveTo = useCallback(
		(targetId: null | number): void => {
			onMoveSectionTo(pageIndex, sectionIndex, targetId);
		},
		[onMoveSectionTo, pageIndex, sectionIndex],
	);

	return (
		<div
			className={getValidClassNames(
				"flex w-full min-w-0 items-center gap-1",
				isDragging ? "opacity-50" : "",
			)}
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition ?? undefined,
			}}
		>
			{isReorderable && (
				<button
					aria-label="Reorder item"
					className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-1 text-text-faint hover:bg-secondary hover:text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
					disabled={isInteractionDisabled}
					type="button"
					{...attributes}
					{...listeners}
				>
					<Icon name="drag-handle" size={ICON_SIZE_SMALL} />
				</button>
			)}

			<button
				className={getValidClassNames(
					"group flex w-full min-w-0 flex-1 cursor-pointer items-center justify-between overflow-hidden rounded-md py-1.5 pl-3 pr-1.5 text-left font-sans text-xs transition-colors",
					isSelected
						? "bg-success-bg font-medium text-accent"
						: "text-text-muted hover:bg-secondary hover:text-text",
				)}
				data-page-index={pageIndex}
				data-section-index={sectionIndex}
				disabled={isInteractionDisabled}
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
					<span className="truncate block min-w-0 flex-1">{sectionTitle}</span>
				</div>
				{getStatusBadge(section.status)}
			</button>

			{isReorderable && (
				<SectionRowMenu
					isDisabled={isInteractionDisabled}
					onDiscard={handleDeleteClick}
					onMoveTo={handleMoveTo}
					onRename={handleRename}
					placementTargets={placementTargets}
					title={sectionTitle}
				/>
			)}
		</div>
	);
};

const PageGroup = ({
	activeNodeType,
	activePageIndex,
	activeSectionIndex,
	isExtractionValidation,
	isInteractionDisabled,
	onDeletePage,
	onDeleteSection,
	onMoveSectionTo,
	onRenameSection,
	onSelectPage,
	onSelectSection,
	page,
	pageIndex,
	placementTargets,
}: {
	activeNodeType: ActiveNodeType;
	activePageIndex: number;
	activeSectionIndex: number;
	isExtractionValidation: boolean;
	isInteractionDisabled: boolean;
	onDeletePage: (pageIndex: number) => void;
	onDeleteSection: (pageIndex: number, sectionIndex: number) => void;
	onMoveSectionTo: (
		pageIndex: number,
		sectionIndex: number,
		targetId: null | number,
	) => void;
	onRenameSection: (pageIndex: number, sectionIndex: number) => void;
	onSelectPage: (event: MouseEvent<HTMLButtonElement>) => void;
	onSelectSection: (event: MouseEvent<HTMLButtonElement>) => void;
	page: ProposedSection;
	pageIndex: number;
	placementTargets: PlacementTarget[];
}): JSX.Element => {
	const isPageSelected =
		pageIndex === activePageIndex && activeNodeType === "parent";

	return (
		<div className="flex w-full min-w-0 flex-col gap-1">
			<SortablePageHeader
				isInteractionDisabled={isInteractionDisabled}
				isPageSelected={isPageSelected}
				isReorderable={isExtractionValidation}
				onDeletePage={onDeletePage}
				onSelectPage={onSelectPage}
				page={page}
				pageIndex={pageIndex}
			/>

			<div className="flex w-full min-w-0 flex-col gap-0.5 pl-5">
				{page.pages.length > EMPTY_LENGTH ? (
					<SortableContext
						items={page.pages.map((section) => section.id)}
						strategy={verticalListSortingStrategy}
					>
						{page.pages.map((section, sectionIndex) => {
							const isSelected =
								pageIndex === activePageIndex &&
								sectionIndex === activeSectionIndex &&
								activeNodeType === "child";

							return (
								<SortableSectionRow
									isInteractionDisabled={isInteractionDisabled}
									isReorderable={isExtractionValidation}
									isSelected={isSelected}
									key={section.id}
									onDeleteSection={onDeleteSection}
									onMoveSectionTo={onMoveSectionTo}
									onRenameSection={onRenameSection}
									onSelectSection={onSelectSection}
									pageIndex={pageIndex}
									placementTargets={placementTargets}
									section={section}
									sectionIndex={sectionIndex}
								/>
							);
						})}
					</SortableContext>
				) : (
					isExtractionValidation && <EmptyPageDropZone pageId={page.id} />
				)}
			</div>
		</div>
	);
};

const StructureAside = ({
	activeNodeType,
	activePageIndex,
	activeSectionIndex,
	isExtractionValidation,
	isInteractionDisabled,
	onDeletePage,
	onDeleteSection,
	onMovePage,
	onMoveSection,
	onMoveSectionTo,
	onRenameSection,
	onSelectPage,
	onSelectSection,
	pages,
	placementTargets,
}: StructureAsideProperties): JSX.Element => {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent): void => {
			const { active, over } = event;

			if (!over || active.id === over.id) {
				return;
			}

			const activeId = String(active.id);
			const overIdRaw = String(over.id);
			const overId = overIdRaw.startsWith(EMPTY_DROP_ZONE_ID_PREFIX)
				? overIdRaw.slice(EMPTY_DROP_ZONE_ID_PREFIX.length)
				: overIdRaw;
			const activeType = active.data.current?.["type"] as
				DragEntityType | undefined;

			if (activeType === "page") {
				const targetPageId = pages.some((page) => page.id === overId)
					? overId
					: pages.find((page) =>
							page.pages.some((section) => section.id === overId),
						)?.id;

				if (targetPageId) {
					onMovePage(activeId, targetPageId);
				}

				return;
			}

			if (activeType === "section") {
				onMoveSection(activeId, overId);
			}
		},
		[onMovePage, onMoveSection, pages],
	);

	return (
		<aside className="flex shrink-0 flex-col gap-3 border-b tablet:border-b-0 tablet:border-r border-border-subtle p-3.5 tablet:p-5 tablet:overflow-y-auto w-full tablet:w-80 tablet:min-w-[320px] tablet:max-w-[320px]">
			<div className="flex items-center justify-between gap-2">
				<div className="font-sans text-2xs font-bold uppercase tracking-wider text-text-muted">
					Proposed Structure
				</div>
			</div>

			<DndContext
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
				sensors={sensors}
			>
				<SortableContext
					items={pages.map((page) => page.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex w-full min-w-0 flex-col gap-3">
						{pages.map((page, pageIndex) => (
							<PageGroup
								activeNodeType={activeNodeType}
								activePageIndex={activePageIndex}
								activeSectionIndex={activeSectionIndex}
								isExtractionValidation={isExtractionValidation}
								isInteractionDisabled={isInteractionDisabled}
								key={page.id}
								onDeletePage={onDeletePage}
								onDeleteSection={onDeleteSection}
								onMoveSectionTo={onMoveSectionTo}
								onRenameSection={onRenameSection}
								onSelectPage={onSelectPage}
								onSelectSection={onSelectSection}
								page={page}
								pageIndex={pageIndex}
								placementTargets={placementTargets}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</aside>
	);
};

export { formatChangeStatusLabel, StructureAside };
