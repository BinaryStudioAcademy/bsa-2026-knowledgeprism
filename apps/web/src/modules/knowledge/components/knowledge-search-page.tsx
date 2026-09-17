import { Heading, Icon } from "~/components/components.js";
import { useCallback, useModal, useState } from "~/hooks/hooks.js";

import {
	AddTermModal,
	EmptyState,
	KnowledgeEntryCard,
	SearchInput,
} from "./components.js";
import {
	MOCK_KNOWLEDGE_ENTRIES,
	PAGE_TITLE,
	SEARCH_PLACEHOLDER,
} from "./libs/constants.js";
import { type KnowledgeEntry } from "./libs/types.js";

const FILTER_ICON_SIZE = 12;
const ADD_TERM_ICON_SIZE = 10;
const EMPTY_RESULTS_LENGTH = 0;
const NEW_ENTRY_AUTHOR = "You";
const NEW_ENTRY_UPDATED_LABEL = "just now";

const KnowledgeSearchPage: React.FC = () => {
	const [query, setQuery] = useState("");
	const [entries, setEntries] = useState<KnowledgeEntry[]>(
		MOCK_KNOWLEDGE_ENTRIES,
	);
	const { hideModal, isOpen, showModal } = useModal();

	const normalizedQuery = query.trim().toLowerCase();

	const filteredEntries = normalizedQuery
		? entries.filter((entry) =>
				[entry.title, entry.content, entry.tag].some((field) =>
					field.toLowerCase().includes(normalizedQuery),
				),
			)
		: entries;

	const handleAddTerm = useCallback(
		(payload: { content: string; tag: string; title: string }): void => {
			setEntries((currentEntries) => [
				{
					author: NEW_ENTRY_AUTHOR,
					content: payload.content,
					id: Date.now(),
					tag: payload.tag,
					title: payload.title,
					updatedLabel: NEW_ENTRY_UPDATED_LABEL,
				},
				...currentEntries,
			]);
			hideModal();
		},
		[hideModal],
	);

	return (
		<div className="p-6 desktop:p-11">
			<div className="flex items-center justify-between">
				<Heading level="2">{PAGE_TITLE}</Heading>

				<button
					className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4.5 py-2.25 font-sans text-[13px] font-medium text-primary-fg"
					onClick={showModal}
					type="button"
				>
					<Icon name="plus" size={ADD_TERM_ICON_SIZE} />
					Add Term
				</button>
			</div>

			<div className="mt-6 mb-7 flex flex-col gap-3 desktop:flex-row desktop:items-center">
				<SearchInput
					onChange={setQuery}
					placeholder={SEARCH_PLACEHOLDER}
					value={query}
				/>
				<button
					className="hidden shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.25 font-sans text-[13px] font-medium text-text desktop:inline-flex"
					type="button"
				>
					<Icon name="filter" size={FILTER_ICON_SIZE} />
					Filter
				</button>
			</div>

			<div className="flex flex-col gap-4">
				{filteredEntries.length === EMPTY_RESULTS_LENGTH ? (
					<EmptyState />
				) : (
					filteredEntries.map((entry) => (
						<KnowledgeEntryCard entry={entry} key={entry.id} query={query} />
					))
				)}
			</div>

			<AddTermModal
				isOpen={isOpen}
				onClose={hideModal}
				onSubmit={handleAddTerm}
			/>
		</div>
	);
};

export { KnowledgeSearchPage };
