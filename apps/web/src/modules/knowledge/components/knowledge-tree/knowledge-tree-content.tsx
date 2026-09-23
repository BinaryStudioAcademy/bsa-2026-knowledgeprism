import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
} from "@knowledgeprism/types";
import React, { useCallback } from "react";

import { useAppDispatch, useCurrentProjectId } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { KbEntryDetail } from "../kb-entry-detail/kb-entry-detail.js";
import "./knowledge-tree-content.css";

type Properties = {
	entry: KnowledgeEntryResponseDto;
	isEditing?: boolean;
	onCancel?: () => void;
};

const KnowledgeTreeContent: React.FC<Properties> = ({
	entry,
	isEditing = false,
	onCancel,
}: Properties) => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();

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

	return (
		<div className="flex flex-1 items-start justify-center overflow-y-scroll px-4 py-6 @3xl:px-10 @3xl:py-9">
			<div className="w-full max-w-190 min-w-0 rounded-lg border border-border bg-surface p-6 shadow-md @3xl:p-10">
				<div className="knowledge-tree-editor-wrapper">
					<KbEntryDetail
						entry={entry}
						isEditing={isEditing}
						onSave={handleSave}
						{...(onCancel ? { onCancel } : {})}
					/>
				</div>
			</div>
		</div>
	);
};

export { KnowledgeTreeContent };
