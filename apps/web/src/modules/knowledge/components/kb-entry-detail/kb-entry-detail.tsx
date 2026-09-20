import { type PartialBlock } from "@blocknote/core";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button, KnowledgeEditor } from "~/components/components.js";
import {
	type KbEntry,
	type KnowledgeEntryUpdateRequestDto,
} from "~/modules/knowledge/libs/types/types.js";

import { KbEntryForm } from "./libs/kb-entry-form.js";

const EMPTY_COUNT = 0;

const DEFAULT_BLOCKS: PartialBlock[] = [
	{
		type: "paragraph",
	},
];

const isBlockArray = (value: unknown): value is PartialBlock[] => {
	return Array.isArray(value);
};

const parseInitialContent = (content?: unknown): PartialBlock[] => {
	if (!content) {
		return DEFAULT_BLOCKS;
	}
	if (isBlockArray(content)) {
		return content.length > EMPTY_COUNT ? content : DEFAULT_BLOCKS;
	}
	return DEFAULT_BLOCKS;
};

interface KbEntryDetailProperties {
	canEdit: boolean;
	entry: KbEntry;
	onSave: (payload: KnowledgeEntryUpdateRequestDto) => Promise<void>;
}

const KbEntryDetail = ({ canEdit, entry, onSave }: KbEntryDetailProperties) => {
	const [isEditing, setIsEditing] = useState(false);
	const [saveErrorMessage, setSaveErrorMessage] = useState<null | string>(null);
	const [previousEntryId, setPreviousEntryId] = useState(entry.id);
	const savingEntryIdReference = useRef<null | number>(null);

	if (entry.id !== previousEntryId) {
		setPreviousEntryId(entry.id);
		setIsEditing(false);
		setSaveErrorMessage(null);
	}

	const readOnlyInitialContent = useMemo(
		() => parseInitialContent(entry.contentJson),
		[entry.contentJson],
	);

	const handleCancel = useCallback((): void => {
		setSaveErrorMessage(null);
		setIsEditing(false);
	}, []);

	const handleStartEdit = useCallback((): void => {
		setSaveErrorMessage(null);
		setIsEditing(true);
	}, []);

	const handleSave = useCallback(
		async (payload: KnowledgeEntryUpdateRequestDto): Promise<boolean> => {
			const currentId = entry.id;
			savingEntryIdReference.current = currentId;

			try {
				setSaveErrorMessage(null);
				await onSave(payload);

				return savingEntryIdReference.current === currentId;
			} catch (error: unknown) {
				if (savingEntryIdReference.current !== currentId) {
					return false;
				}

				const candidate = error as { message?: string };
				setSaveErrorMessage(
					candidate.message ?? "Failed to save changes. Please try again.",
				);

				return false;
			} finally {
				if (savingEntryIdReference.current === currentId) {
					savingEntryIdReference.current = null;
				}
			}
		},
		[entry.id, onSave],
	);

	return (
		<div className="kb-container relative flex flex-col gap-4">
			{isEditing ? (
				<KbEntryForm
					entry={entry}
					key={entry.id}
					onCancel={handleCancel}
					onSave={handleSave}
					saveErrorMessage={saveErrorMessage}
				/>
			) : (
				<>
					<div className="kb-header flex min-h-10 justify-end pb-4">
						{canEdit && (
							<Button onClick={handleStartEdit} type="button">
								Edit
							</Button>
						)}
					</div>

					<div className="kb-body">
						<h1 className="mb-4 text-2xl font-bold">{entry.title}</h1>

						<div className="-mx-12">
							<KnowledgeEditor
								initialContent={readOnlyInitialContent}
								isEditable={false}
								key={`${String(entry.id)}-${entry.updatedAt ?? ""}`}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export { KbEntryDetail };
