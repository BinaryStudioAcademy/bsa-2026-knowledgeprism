import {
	type GlossaryConsistencyMatchDto,
	type GlossaryTermRequestDto,
} from "@knowledgeprism/types";
import { type JSX, useMemo } from "react";

import { useAppDispatch, useCallback } from "~/hooks/hooks.js";

import { toGlossaryTermName } from "../../libs/helpers/helpers.js";
import { actions } from "../../state/state.js";
import { GlossaryTermFormModal } from "../glossary-term-form-modal/glossary-term-form-modal.js";

type Properties = {
	match: GlossaryConsistencyMatchDto;
	onAdded: () => void;
	onCancel: () => void;
	projectId: string;
};

const AddToGlossaryModal = ({
	match,
	onAdded,
	onCancel,
	projectId,
}: Properties): JSX.Element => {
	const dispatch = useAppDispatch();

	const initialValues = useMemo(
		(): GlossaryTermRequestDto => ({
			definition: "",
			name: toGlossaryTermName(match.sourceExcerpt),
			relatedTermIds: [match.matchedTermId],
		}),
		[match],
	);

	const handleSubmit = useCallback(
		async (payload: GlossaryTermRequestDto): Promise<void> => {
			await dispatch(actions.createTerm({ payload, projectId })).unwrap();
			onAdded();
		},
		[dispatch, onAdded, projectId],
	);

	return (
		<GlossaryTermFormModal
			initialValues={initialValues}
			onCancel={onCancel}
			onSubmit={handleSubmit}
			projectId={projectId}
			submitLabel="Add term"
			termId={null}
			title="Add to glossary"
		/>
	);
};

export { AddToGlossaryModal };
