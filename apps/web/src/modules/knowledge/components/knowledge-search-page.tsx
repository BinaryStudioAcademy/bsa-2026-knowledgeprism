import { Heading, Icon } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCallback,
	useCurrentProjectId,
	useEffect,
	useModal,
	useState,
} from "~/hooks/hooks.js";
import { useDebouncedValue } from "~/hooks/use-debounced-value/use-debounced-value.hook.js";

import { flattenContentToText } from "../libs/helpers/helpers.js";
import { actions } from "../state/state.js";
import {
	AddTermModal,
	EmptyState,
	KnowledgeEntryCard,
	SearchInput,
} from "./components.js";
import { PAGE_TITLE, SEARCH_PLACEHOLDER } from "./libs/constants.js";
import { type KnowledgeEntry } from "./libs/types.js";

const FILTER_ICON_SIZE = 12;
const ADD_TERM_ICON_SIZE = 10;
const EMPTY_RESULTS_LENGTH = 0;
const SEARCH_DEBOUNCE_MS = 300;

const KnowledgeSearchPage: React.FC = () => {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
	const { hideModal, isOpen, showModal } = useModal();
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const { searchResults } = useAppSelector((state) => state.knowledge);

	useEffect(() => {
		void dispatch(
			actions.searchKnowledge({ projectId, query: debouncedQuery.trim() }),
		);
	}, [debouncedQuery, dispatch, projectId]);

	const entries: KnowledgeEntry[] = searchResults.map((item) => ({
		author: "",
		content: flattenContentToText(item.content),
		id: item.id,
		tag: "",
		title: item.title,
		updatedLabel: "",
	}));

	const handleAddTerm = useCallback((): void => {
		hideModal();
	}, [hideModal]);

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
				{entries.length === EMPTY_RESULTS_LENGTH ? (
					<EmptyState />
				) : (
					entries.map((entry) => (
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
