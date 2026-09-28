import { useAppDispatch, useEffect } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";

const useProjectKnowledgePipeline = ({
	canEdit,
	projectId,
}: {
	canEdit: boolean;
	projectId: string | undefined;
}): void => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (!canEdit || !projectId) {
			dispatch(actions.resetState(null));

			return;
		}

		dispatch(actions.resetState(projectId));
		void dispatch(actions.initializeProjectKnowledgePipeline({ projectId }));

		return () => {
			dispatch(actions.releasePipeline());
		};
	}, [canEdit, dispatch, projectId]);
};

export { useProjectKnowledgePipeline };
