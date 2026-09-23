import React, { useCallback } from "react";

import { type KnowledgeEntryResponseDto } from "../../libs/mock-knowledge-tree.js";
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
	const handleSave = useCallback((): Promise<boolean> => {
		//TODO: Implement API call to update the knowledge entry
		if (onCancel) {
			onCancel();
		}
		return Promise.resolve(true);
	}, [onCancel]);

	return (
		<div className="flex flex-1 items-start justify-center overflow-y-scroll px-4 py-6 @3xl:px-10 @3xl:py-9">
			<div className="w-full max-w-190 min-w-0 rounded-lg border border-border bg-surface p-6 shadow-md @3xl:p-10">
				<div className="knowledge-tree-editor-wrapper">
					<KbEntryDetail
						entry={entry}
						isEditing={isEditing}
						onCancel={onCancel}
						onSave={handleSave}
					/>
				</div>
			</div>
		</div>
	);
};

export { KnowledgeTreeContent };
