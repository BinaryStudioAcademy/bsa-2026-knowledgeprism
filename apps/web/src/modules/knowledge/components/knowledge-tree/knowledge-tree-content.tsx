import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
} from "@knowledgeprism/types";
import React, { useCallback, useEffect, useRef } from "react";

import { useAppDispatch, useCurrentProjectId } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import { scrollToKnowledgeSection } from "../../libs/helpers/scroll-to-knowledge-section.helper.js";
import { KbEntryDetail } from "../kb-entry-detail/kb-entry-detail.js";
import "./knowledge-tree-content.css";

const SCROLL_SETTLE_MS = 400;

type Properties = {
	entry: KnowledgeEntryResponseDto;
	isEditing?: boolean;
	onCancel?: () => void;
	onRemoveSection?: ((sectionId: number) => Promise<void>) | undefined;
	onSaveSection?: SaveSection | undefined;
	scrollSectionId?: number | undefined;
	sections?: KnowledgeEntryResponseDto[] | undefined;
};

type SaveSection = (
	sectionId: number,
	payload: KnowledgeEntryUpdateRequestDto,
) => Promise<void>;

const KnowledgeTreeContent: React.FC<Properties> = ({
	entry,
	isEditing = false,
	onCancel,
	onRemoveSection,
	onSaveSection,
	scrollSectionId,
	sections,
}: Properties) => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const containerReference = useRef<HTMLDivElement>(null);
	const contentReference = useRef<HTMLDivElement>(null);
	const sectionKey = (sections ?? []).map((section) => section.id).join(",");

	useEffect(() => {
		const container = containerReference.current;
		const content = contentReference.current;

		if (!container || !content || sectionKey === "") {
			return;
		}

		const scroll = (): void => {
			scrollToKnowledgeSection(container, scrollSectionId);
		};

		scroll();

		const observer = new ResizeObserver(scroll);

		observer.observe(content);

		const settleTimer = setTimeout(() => {
			observer.disconnect();
		}, SCROLL_SETTLE_MS);

		return () => {
			observer.disconnect();
			clearTimeout(settleTimer);
		};
	}, [scrollSectionId, sectionKey]);

	const handleSave = useCallback(
		async (payload: KnowledgeEntryUpdateRequestDto): Promise<void> => {
			if (!projectId) {
				return;
			}

			await dispatch(
				actions.updateKnowledgeEntry({
					entryId: entry.id,
					payload,
					projectId,
				}),
			).unwrap();

			if (onCancel) {
				onCancel();
			}
		},
		[dispatch, entry.id, onCancel, projectId],
	);

	const hasSections = (sections?.length ?? EMPTY_LENGTH) > EMPTY_LENGTH;

	return (
		<div
			className="flex flex-1 items-start justify-center overflow-y-scroll px-4 py-6 @3xl:px-10 @3xl:py-9"
			ref={containerReference}
		>
			<div
				className="w-full min-w-0 rounded-lg border border-border bg-surface p-6 shadow-md @3xl:p-10"
				ref={contentReference}
			>
				<div className="knowledge-tree-editor-wrapper">
					<KbEntryDetail
						entry={entry}
						isEditing={isEditing}
						onCancel={onCancel}
						onRemoveSection={onRemoveSection}
						onSave={handleSave}
						onSaveSection={onSaveSection}
						sections={hasSections ? sections : undefined}
					/>
				</div>
			</div>
		</div>
	);
};

export { KnowledgeTreeContent };
