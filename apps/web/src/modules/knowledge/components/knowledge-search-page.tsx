import { Heading, Icon } from "~/components/components.js";
import { useState } from "~/hooks/hooks.js";

import { EmptyState, KnowledgeEntryCard, SearchInput } from "./components.js";
import {
	MOCK_KNOWLEDGE_ENTRIES,
	PAGE_TITLE,
	SEARCH_PLACEHOLDER,
} from "./libs/constants.js";

const FILTER_ICON_SIZE = 12;
const EMPTY_RESULTS_LENGTH = 0;

const KnowledgeSearchPage: React.FC = () => {
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	const filteredEntries = normalizedQuery
		? MOCK_KNOWLEDGE_ENTRIES.filter((entry) =>
				[entry.title, entry.content, entry.tag].some((field) =>
					field.toLowerCase().includes(normalizedQuery),
				),
			)
		: MOCK_KNOWLEDGE_ENTRIES;

	return (
		<div className="p-6 desktop:p-11">
			<Heading level="2">{PAGE_TITLE}</Heading>

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

			<div className="flex flex-col gap-4 desktop:max-w-205">
				{filteredEntries.length === EMPTY_RESULTS_LENGTH ? (
					<EmptyState query={query} />
				) : (
					filteredEntries.map((entry) => (
						<KnowledgeEntryCard entry={entry} key={entry.id} />
					))
				)}
			</div>
		</div>
	);
};

export { KnowledgeSearchPage };
