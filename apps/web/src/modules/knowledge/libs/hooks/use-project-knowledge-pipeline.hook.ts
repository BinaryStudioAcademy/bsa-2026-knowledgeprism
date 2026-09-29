import { useEffect, useLayoutEffect } from "react";

import { useAppDispatch } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";

const useProjectKnowledgePipeline = ({
	canEdit,
	projectId,
}: {
	canEdit: boolean;
	projectId: string | undefined;
}): void => {
	const dispatch = useAppDispatch();

	useLayoutEffect(() => {
		dispatch(actions.resetState(projectId ?? null));

		return () => {
			dispatch(actions.releasePipeline());
		};
	}, [dispatch, projectId]);

	useEffect(() => {
		if (canEdit && projectId) {
			void dispatch(actions.initializeProjectKnowledgePipeline({ projectId }));
		}
	}, [canEdit, dispatch, projectId]);
};

export { useProjectKnowledgePipeline };
