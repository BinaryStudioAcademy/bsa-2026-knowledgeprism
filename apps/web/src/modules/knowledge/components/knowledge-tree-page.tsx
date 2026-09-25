import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
	useAppDispatch,
	useAppSelector,
	useCanWriteKnowledge,
	useCurrentProjectId,
} from "~/hooks/hooks.js";

import { actions } from "../knowledge.js";
import { KnowledgeTreeLayout } from "./knowledge-tree/knowledge-tree-layout.js";

const KnowledgeTreePage: React.FC = () => {
	const projectId = useCurrentProjectId();
	const dispatch = useAppDispatch();
	const canWriteKnowledge = useCanWriteKnowledge();
	const { selectedEntry, tree } = useAppSelector((state) => state.knowledge);

	const [manualSelectedPageId, setManualSelectedPageId] = useState<
		number | undefined
	>();
	const [lastProjectId, setLastProjectId] = useState<null | string>(null);
	const [fetchedProjectId, setFetchedProjectId] = useState<null | string>(null);

	if (projectId !== lastProjectId) {
		setLastProjectId(projectId);
		setManualSelectedPageId(undefined);
		setFetchedProjectId(null);
	}

	useEffect(() => {
		if (!projectId) {
			return;
		}

		void dispatch(actions.fetchKnowledgeTree({ projectId }))
			.unwrap()
			.finally(() => {
				setFetchedProjectId(projectId);
			});
	}, [dispatch, projectId]);

	const isTreeReady = fetchedProjectId === projectId;
	const parentIds = new Set(tree.map((item) => item.parentId));
	const firstAvailablePage = isTreeReady
		? tree.find(
				(item) =>
					(item.type === "PAGE" || item.type === "ENTRY") &&
					!parentIds.has(item.id),
			)
		: undefined;
	const activePageId = manualSelectedPageId ?? firstAvailablePage?.id;

	useEffect(() => {
		if (activePageId === undefined || !projectId) {
			return;
		}

		void dispatch(
			actions.fetchKnowledgeEntry({ entryId: activePageId, projectId }),
		);
	}, [dispatch, activePageId, projectId]);

	const handleSelectPage = useCallback((id: number) => {
		setManualSelectedPageId(id);
	}, []);

	const entries = useMemo(() => {
		if (!selectedEntry) {
			return {};
		}
		return { [selectedEntry.id]: selectedEntry };
	}, [selectedEntry]);

	return (
		<KnowledgeTreeLayout
			canEdit={canWriteKnowledge}
			entries={entries}
			isTreeReady={isTreeReady}
			items={tree}
			onSelectPage={handleSelectPage}
			selectedPageId={activePageId}
		/>
	);
};

export { KnowledgeTreePage };
