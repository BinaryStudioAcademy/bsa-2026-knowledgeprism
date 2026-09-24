import React, { useCallback, useMemo, useState } from "react";

import { useAppDispatch, useAppSelector, useModal } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "../../libs/mock-knowledge-tree.js";
import { AddKnowledgeModal } from "../add-knowledge-modal/add-knowledge-modal.js";
import { IntegrationPreview } from "../integration-preview/integration-preview.js";
import { DEFAULT_PROPOSED_STRUCTURE } from "../integration-preview/libs/constants.js";
import { LoadingState } from "../loading-state/loading-state.js";
import { KnowledgeTreeContent } from "./knowledge-tree-content.js";
import { KnowledgeTreeEmptyState } from "./knowledge-tree-empty-state.js";
import { KnowledgeTreeHeader } from "./knowledge-tree-header.js";
import { KnowledgeTreeSidebar } from "./knowledge-tree-sidebar.js";

const DEFAULT_BASELINE = 1;
const LIVE_VERSION_INCREMENT = 1;
const LIVE_VERSION_WITH_CONFLICTS =
	DEFAULT_BASELINE + LIVE_VERSION_INCREMENT;

const previewScenarios = [
	{
		id: "clean",
		label: "No live changes",
	},
	{
		id: "version-conflict",
		label: "Live changed",
	},
] as const;

type PreviewScenario = (typeof previewScenarios)[number]["id"];

type Properties = {
	canEdit?: boolean;
	entries: Record<number, KnowledgeEntryResponseDto>;
	items: KnowledgeTreeItemResponseDto[];
	onSelectPage: (id: number) => void;
	selectedPageId?: number | undefined;
};

const KnowledgeTreeLayout: React.FC<Properties> = ({
	canEdit = false,
	entries,
	items,
	onSelectPage,
	selectedPageId,
}: Properties) => {
	const dispatch = useAppDispatch();
	const { isAddingKnowledge } = useAppSelector((state) => state.knowledge);

	const {
		hideModal: handleCloseAddModal,
		isOpen: isAddModalOpen,
		showModal: handleOpenAddModal,
	} = useModal();

	const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
	const [previewScenario, setPreviewScenario] =
		useState<PreviewScenario>("clean");

	const isKbEmpty = items.length === EMPTY_LENGTH;
	const currentLiveVersion =
		previewScenario === "version-conflict"
			? LIVE_VERSION_WITH_CONFLICTS
			: DEFAULT_BASELINE;

	const handleAddMore = useCallback((): void => {
		setIsPreviewOpen(false);
		handleOpenAddModal();
	}, [handleOpenAddModal]);

	const handleApproveIntegration = useCallback((): void => {
		dispatch(actions.finishAddingKnowledge());
	}, [dispatch]);

	const handleClosePreview = useCallback((): void => {
		setIsPreviewOpen(false);
	}, []);

	const handleCloseSidebar = useCallback((): void => {
		setIsSidebarOpen(false);
	}, []);

	const handleFinishLoading = useCallback((): void => {
		dispatch(actions.finishAddingKnowledge());
		setIsPreviewOpen(true);
	}, [dispatch]);

	const handleOpenPreview = useCallback((): void => {
		setIsPreviewOpen(true);
	}, []);

	const handleOpenSidebar = useCallback((): void => {
		setIsSidebarOpen(true);
	}, []);

	const handleSelectPreviewScenario = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			const nextScenario = event.currentTarget.dataset[
				"scenario"
			] as PreviewScenario;

			setPreviewScenario(nextScenario);
		},
		[],
	);

	const breadcrumbs = useMemo(() => {
		if (!selectedPageId) {
			return [];
		}
		const path: string[] = [];
		let currentId: null | number = selectedPageId;

		while (currentId !== null) {
			const item = items.find((item) => item.id === currentId);
			if (item) {
				path.unshift(item.title);
				currentId = item.parentId;
			} else {
				currentId = null;
			}
		}

		return path;
	}, [items, selectedPageId]);

	if (isPreviewOpen) {
		return (
			<div className="flex h-full w-full flex-col bg-bg">
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3 py-2 tablet:px-4">
					<span className="font-sans text-2xs font-semibold uppercase tracking-wide text-text-muted">
						Mock scenario
					</span>
					<div className="inline-flex rounded-md border border-border bg-bg p-0.5">
						{previewScenarios.map((scenario) => {
							const isSelected = scenario.id === previewScenario;

							return (
								<button
									className={getValidClassNames(
										"rounded px-2.5 py-1 font-sans text-2xs font-medium transition-colors",
										isSelected
											? "bg-primary text-primary-fg"
											: "text-text-muted hover:bg-secondary hover:text-text",
									)}
									data-scenario={scenario.id}
									key={scenario.id}
									onClick={handleSelectPreviewScenario}
									type="button"
								>
									{scenario.label}
								</button>
							);
						})}
					</div>
				</div>
				<div className="min-h-0 flex-1">
					<IntegrationPreview
						baselineVersion={DEFAULT_BASELINE}
						currentLiveVersion={currentLiveVersion}
						onAddMore={handleAddMore}
						onApprove={handleApproveIntegration}
						onClose={handleClosePreview}
						proposedStructure={DEFAULT_PROPOSED_STRUCTURE}
					/>
				</div>
				<AddKnowledgeModal
					isOpen={isAddModalOpen}
					onClose={handleCloseAddModal}
				/>
			</div>
		);
	}

	if (isKbEmpty) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-bg">
				{isAddingKnowledge ? (
					<LoadingState onFinish={handleFinishLoading} variant="full" />
				) : (
					<KnowledgeTreeEmptyState />
				)}
				<AddKnowledgeModal
					isOpen={isAddModalOpen}
					onClose={handleCloseAddModal}
				/>
			</div>
		);
	}

	const selectedEntry = selectedPageId ? entries[selectedPageId] : undefined;

	return (
		<div className="@container flex h-full w-full bg-bg">
			<KnowledgeTreeSidebar
				isOpen={isSidebarOpen}
				items={items}
				onClose={handleCloseSidebar}
				onSelectPage={onSelectPage}
				selectedPageId={selectedPageId}
			/>
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<KnowledgeTreeHeader
					breadcrumbs={breadcrumbs}
					canEdit={canEdit}
					onOpenSidebar={handleOpenSidebar}
					onPreview={handleOpenPreview}
					showCompactLoading={isAddingKnowledge}
				/>
				{isAddingKnowledge && (
					<div className="border-b border-border bg-surface px-4 py-4 @5xl:hidden">
						<LoadingState onPreview={handleOpenPreview} variant="compact" />
					</div>
				)}
				{selectedEntry ? (
					<KnowledgeTreeContent entry={selectedEntry} />
				) : (
					<div className="flex flex-1 items-center justify-center text-text-muted">
						Select a page to view its content.
					</div>
				)}
			</div>
			<AddKnowledgeModal
				isOpen={isAddModalOpen}
				onClose={handleCloseAddModal}
			/>
		</div>
	);
};

export { KnowledgeTreeLayout };
