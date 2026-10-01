import { type GlossaryTermRequestDto } from "@knowledgeprism/types";

import { Button, Heading, Icon, Loader } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCallback,
	useCanWriteKnowledge,
	useEffect,
	useState,
} from "~/hooks/hooks.js";
import { useDebouncedValue } from "~/hooks/use-debounced-value/use-debounced-value.hook.js";
import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import {
	PAGE_TITLE,
	SEARCH_DEBOUNCE_MS,
	SEARCH_PLACEHOLDER,
} from "../../libs/constants/constants.js";
import { GlossaryDialog } from "../../libs/enums/enums.js";
import { actions } from "../../state/state.js";
import { DeleteTermModal } from "../delete-term-modal/delete-term-modal.js";
import { EmptyState } from "../empty-state/empty-state.js";
import { GlossaryTermCard } from "../glossary-term-card/glossary-term-card.js";
import { GlossaryTermDetailsModal } from "../glossary-term-details-modal/glossary-term-details-modal.js";
import { GlossaryTermFormModal } from "../glossary-term-form-modal/glossary-term-form-modal.js";
import { SearchInput } from "../search-input/search-input.js";

const ADD_TERM_ICON_SIZE = 10;
const EMPTY_LENGTH = 0;

type Properties = {
	projectId: string;
};

const GlossaryContent: React.FC<Properties> = ({ projectId }: Properties) => {
	const dispatch = useAppDispatch();
	const canWriteKnowledge = useCanWriteKnowledge();
	const { dataStatus, selectedTerm, selectedTermStatus, terms } =
		useAppSelector(({ glossary }) => glossary);
	const [query, setQuery] = useState("");
	const [isConfirming, setIsConfirming] = useState(false);
	const [dialog, setDialog] = useState<ValueOf<typeof GlossaryDialog>>(
		GlossaryDialog.NONE,
	);
	const searchQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();

	const loadTerms = useCallback(
		() => dispatch(actions.loadTerms({ projectId, query: searchQuery })),
		[dispatch, projectId, searchQuery],
	);

	useEffect(() => {
		const request = loadTerms();

		return (): void => {
			request.abort();
		};
	}, [loadTerms]);

	const handleCloseDialog = useCallback((): void => {
		setDialog(GlossaryDialog.NONE);
	}, []);

	const handleShowDetails = useCallback((): void => {
		setDialog(GlossaryDialog.DETAILS);
	}, []);

	const handleShowCreate = useCallback((): void => {
		setDialog(GlossaryDialog.CREATE);
	}, []);

	const handleShowEdit = useCallback((): void => {
		setDialog(GlossaryDialog.EDIT);
	}, []);

	const handleShowDelete = useCallback((): void => {
		setDialog(GlossaryDialog.DELETE);
	}, []);

	const handleSelectTerm = useCallback(
		(id: number): void => {
			setDialog(GlossaryDialog.DETAILS);
			void dispatch(actions.loadTerm({ id, projectId }));
		},
		[dispatch, projectId],
	);

	const handleCreate = useCallback(
		async (payload: GlossaryTermRequestDto): Promise<void> => {
			await dispatch(actions.createTerm({ payload, projectId })).unwrap();
			setDialog(GlossaryDialog.NONE);
			void loadTerms();
		},
		[dispatch, loadTerms, projectId],
	);

	const handleUpdate = useCallback(
		async (payload: GlossaryTermRequestDto): Promise<void> => {
			if (!selectedTerm) {
				return;
			}

			await dispatch(
				actions.updateTerm({ id: selectedTerm.id, payload, projectId }),
			).unwrap();
			setDialog(GlossaryDialog.DETAILS);
			void loadTerms();
		},
		[dispatch, loadTerms, projectId, selectedTerm],
	);

	const handleConfirm = useCallback((): void => {
		if (!selectedTerm) {
			return;
		}

		setIsConfirming(true);
		void dispatch(
			actions.confirmTerm({ id: selectedTerm.id, projectId }),
		).finally(() => {
			setIsConfirming(false);
		});
	}, [dispatch, projectId, selectedTerm]);

	const handleDelete = useCallback(async (): Promise<void> => {
		if (!selectedTerm) {
			return;
		}

		const result = await dispatch(
			actions.deleteTerm({ id: selectedTerm.id, projectId }),
		);

		if (actions.deleteTerm.fulfilled.match(result)) {
			setDialog(GlossaryDialog.NONE);
		}
	}, [dispatch, projectId, selectedTerm]);

	const getEmptyMessage = (): string => {
		if (dataStatus === DataStatus.REJECTED) {
			return "The glossary couldn't be loaded.";
		}

		if (searchQuery) {
			return `No terms match “${searchQuery}”.`;
		}

		return canWriteKnowledge
			? "No terms yet. Add the first one to start the glossary."
			: "No terms yet.";
	};

	const renderTerms = (): React.ReactNode => {
		if (dataStatus === DataStatus.PENDING && terms.length === EMPTY_LENGTH) {
			return (
				<div className="flex justify-center py-10">
					<Loader size="md" />
				</div>
			);
		}

		if (terms.length === EMPTY_LENGTH) {
			return <EmptyState message={getEmptyMessage()} />;
		}

		return (
			<ul className="flex flex-col gap-4">
				{terms.map((term) => (
					<li key={term.id}>
						<GlossaryTermCard onSelect={handleSelectTerm} term={term} />
					</li>
				))}
			</ul>
		);
	};

	return (
		<div className="p-6 desktop:p-11">
			<div className="flex items-center justify-between gap-4">
				<Heading level="2">{PAGE_TITLE}</Heading>
				{canWriteKnowledge && (
					<Button onClick={handleShowCreate}>
						<Icon name="plus" size={ADD_TERM_ICON_SIZE} />
						Add term
					</Button>
				)}
			</div>

			<div className="mt-6 mb-7 flex flex-col">
				<SearchInput
					onChange={setQuery}
					placeholder={SEARCH_PLACEHOLDER}
					value={query}
				/>
			</div>

			{renderTerms()}

			{dialog === GlossaryDialog.DETAILS && (
				<GlossaryTermDetailsModal
					canEdit={canWriteKnowledge}
					hasFailed={selectedTermStatus === DataStatus.REJECTED}
					isConfirming={isConfirming}
					onClose={handleCloseDialog}
					onConfirm={handleConfirm}
					onDelete={handleShowDelete}
					onEdit={handleShowEdit}
					onSelectTerm={handleSelectTerm}
					term={selectedTerm}
				/>
			)}

			{dialog === GlossaryDialog.CREATE && (
				<GlossaryTermFormModal
					onCancel={handleCloseDialog}
					onSubmit={handleCreate}
					projectId={projectId}
					submitLabel="Add term"
					termId={null}
					title="Add term"
				/>
			)}

			{dialog === GlossaryDialog.EDIT && selectedTerm && (
				<GlossaryTermFormModal
					initialValues={{
						definition: selectedTerm.definition,
						name: selectedTerm.name,
						relatedTermIds: selectedTerm.relatedTerms.map(({ id }) => id),
					}}
					onCancel={handleShowDetails}
					onSubmit={handleUpdate}
					projectId={projectId}
					submitLabel="Save"
					termId={selectedTerm.id}
					title="Edit term"
				/>
			)}

			{dialog === GlossaryDialog.DELETE && selectedTerm && (
				<DeleteTermModal
					name={selectedTerm.name}
					onCancel={handleShowDetails}
					onConfirm={handleDelete}
				/>
			)}
		</div>
	);
};

export { GlossaryContent };
