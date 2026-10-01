import {
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { Button, KnowledgeEditor } from "~/components/components.js";
import {
	type KbEntry,
	type KnowledgeEntryUpdateRequestDto,
} from "~/modules/knowledge/libs/types/types.js";

import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import { KNOWLEDGE_SECTION_ATTRIBUTE } from "../../libs/helpers/scroll-to-knowledge-section.helper.js";
import { parseInitialContent } from "./libs/helpers/parse-initial-content.helper.js";
import { KbEntryForm } from "./libs/kb-entry-form.js";

interface KbEntryDetailProperties {
	entry: KbEntry;
	isEditing?: boolean;
	onCancel?: (() => void) | undefined;
	onRemoveSection?: ((sectionId: number) => Promise<void>) | undefined;
	onSave: (payload: KnowledgeEntryUpdateRequestDto) => Promise<void>;
	onSaveSection?: SaveSection | undefined;
	sections?: KbEntry[] | undefined;
}

type SaveSection = (
	sectionId: number,
	payload: KnowledgeEntryUpdateRequestDto,
) => Promise<void>;

const KbEntryDetail = ({
	entry,
	isEditing = false,
	onCancel,
	onRemoveSection,
	onSave,
	onSaveSection,
	sections,
}: KbEntryDetailProperties) => {
	const [previousEntryId, setPreviousEntryId] = useState(entry.id);
	const savingEntryIdReference = useRef<null | number>(null);

	if (entry.id !== previousEntryId) {
		setPreviousEntryId(entry.id);
	}

	useEffect(() => {
		savingEntryIdReference.current = null;
	}, [entry.id]);

	const readOnlyInitialContent = useMemo(
		() => parseInitialContent(entry.contentJson, entry.title),
		[entry.contentJson, entry.title],
	);
	const sectionList = sections ?? [];
	const hasSections = sectionList.length > EMPTY_LENGTH;
	const hasPageBody =
		Array.isArray(entry.contentJson) && entry.contentJson.length > EMPTY_LENGTH;

	const handleCancel = useCallback((): void => {
		savingEntryIdReference.current = null;
		if (onCancel) {
			onCancel();
		}
	}, [onCancel]);

	const handleSectionSave = useCallback(
		(sectionId: number) =>
			async (payload: KnowledgeEntryUpdateRequestDto): Promise<boolean> => {
				if (!onSaveSection) {
					return false;
				}

				try {
					await onSaveSection(sectionId, payload);

					return true;
				} catch {
					return false;
				}
			},
		[onSaveSection],
	);

	const handleRemoveSection = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const sectionId = Number(event.currentTarget.dataset["sectionId"]);

			if (!onRemoveSection || !Number.isSafeInteger(sectionId)) {
				return;
			}

			void onRemoveSection(sectionId);
		},
		[onRemoveSection],
	);

	const handleSave = useCallback(
		async (payload: KnowledgeEntryUpdateRequestDto): Promise<boolean> => {
			const currentId = entry.id;

			savingEntryIdReference.current = currentId;

			try {
				await onSave(payload);

				return savingEntryIdReference.current === currentId;
			} catch {
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
				<div className="flex flex-col gap-8">
					<KbEntryForm
						entry={entry}
						key={entry.id}
						onCancel={handleCancel}
						onSave={handleSave}
					/>
					{hasSections
						? sectionList.map((section) => (
								<section className="flex flex-col gap-3" key={section.id}>
									<KbEntryForm
										closesAfterSave={false}
										entry={section}
										formId={`kb-section-form-${String(section.id)}`}
										key={`${String(section.id)}-${section.updatedAt ?? ""}`}
										onSave={handleSectionSave(section.id)}
										showSubmit={true}
									/>
									<Button
										data-section-id={section.id}
										onClick={handleRemoveSection}
										variant="secondary"
									>
										Remove
									</Button>
								</section>
							))
						: null}
				</div>
			) : (
				<>
					<h1 className="mb-2.5 font-serif text-h1 wrap-break-word  text-text">
						{entry.title}
					</h1>
					<div className="mb-7 font-mono text-xs text-text-faint">
						<span>
							Last updated:{" "}
							{entry.updatedAt
								? new Date(entry.updatedAt).toLocaleDateString(undefined)
								: "Unknown"}
						</span>
					</div>

					{hasPageBody && hasSections ? (
						<KnowledgeEditor
							initialContent={readOnlyInitialContent}
							isEditable={false}
							key={`${String(entry.id)}-${entry.updatedAt ?? ""}-intro`}
						/>
					) : null}
					{hasSections ? (
						sectionList.map((section) => (
							<section
								className="knowledge-section"
								key={section.id}
								{...{
									[KNOWLEDGE_SECTION_ATTRIBUTE]: String(section.id),
								}}
							>
								<h2 className="knowledge-section-heading">{section.title}</h2>
								<KnowledgeEditor
									initialContent={parseInitialContent(
										section.contentJson,
										section.title,
									)}
									isEditable={false}
									key={`${String(section.id)}-${section.updatedAt ?? ""}`}
								/>
							</section>
						))
					) : (
						<KnowledgeEditor
							initialContent={readOnlyInitialContent}
							isEditable={false}
							key={`${String(entry.id)}-${entry.updatedAt ?? ""}`}
						/>
					)}
				</>
			)}
		</div>
	);
};

export { KbEntryDetail };
