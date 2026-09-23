import { type PartialBlock } from "@blocknote/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { KnowledgeEditor } from "~/components/components.js";
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
	entry: KbEntry;
	isEditing?: boolean;
	onCancel?: () => void;
	onSave: (payload: KnowledgeEntryUpdateRequestDto) => Promise<void>;
}

const KbEntryDetail = ({
	entry,
	isEditing = false,
	onCancel,
	onSave,
}: KbEntryDetailProperties) => {
	const [saveErrorMessage, setSaveErrorMessage] = useState<null | string>(null);
	const [previousEntryId, setPreviousEntryId] = useState(entry.id);
	const savingEntryIdReference = useRef<null | number>(null);

	if (entry.id !== previousEntryId) {
		setPreviousEntryId(entry.id);
		setSaveErrorMessage(null);
	}

	useEffect(() => {
		savingEntryIdReference.current = null;
	}, [entry.id]);

	const readOnlyInitialContent = useMemo(
		() => parseInitialContent(entry.contentJson),
		[entry.contentJson],
	);

	const handleCancel = useCallback((): void => {
		setSaveErrorMessage(null);
		savingEntryIdReference.current = null;
		if (onCancel) {
			onCancel();
		}
	}, [onCancel]);

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
		<div className="kb-container relative">
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
					<h1 className="mb-2.5 font-serif text-h1 text-text">{entry.title}</h1>
					<div className="mb-7 font-mono text-xs text-text-faint">
						<span>
							Last updated:{" "}
							{entry.updatedAt
								? new Date(entry.updatedAt).toLocaleDateString(undefined)
								: "Unknown"}
						</span>
					</div>

					<KnowledgeEditor
						initialContent={readOnlyInitialContent}
						isEditable={false}
						key={`${String(entry.id)}-${entry.updatedAt ?? ""}`}
					/>
				</>
			)}
		</div>
	);
};

export { KbEntryDetail };
