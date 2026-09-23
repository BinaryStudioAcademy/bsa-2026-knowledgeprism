import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
} from "~/hooks/hooks.js";

import { actions } from "../knowledge.js";
import { KnowledgeTreeLayout } from "./knowledge-tree/knowledge-tree-layout.js";

const KnowledgeTreePage: React.FC = () => {
	const projectId = useCurrentProjectId();
	const dispatch = useAppDispatch();
	const { selectedEntry, tree } = useAppSelector((state) => state.knowledge);

	// Track manual selection
	const [manualSelectedPageId, setManualSelectedPageId] = useState<
		number | undefined
	>();
	const [lastProjectId, setLastProjectId] = useState<null | string>(null);
	const [fetchedProjectId, setFetchedProjectId] = useState<null | string>(null);

	// Reset manual selection when project changes
	if (projectId !== lastProjectId) {
		setLastProjectId(projectId);
		setManualSelectedPageId(undefined);
		setFetchedProjectId(null);
	}

	// Fetch tree when project changes
	useEffect(() => {
		if (!projectId) {
			return;
		}

		void dispatch(actions.fetchKnowledgeTree({ projectId }))
			.unwrap()
			.then(() => {
				setFetchedProjectId(projectId);
			});
	}, [dispatch, projectId]);

	// Derive the active page: either manually selected, or the first available
	// Only calculate first available if the tree actually belongs to the current project!
	const isTreeReady = fetchedProjectId === projectId;
	const firstAvailablePage = isTreeReady
		? tree.find((item) => item.type === "PAGE" || item.type === "ENTRY")
		: undefined;
	const activePageId = manualSelectedPageId ?? firstAvailablePage?.id;

	// Fetch entry content when the active page changes
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
			canEdit={true}
			entries={entries}
			items={tree}
			onSelectPage={handleSelectPage}
			selectedPageId={activePageId}
		/>
	);
};

export { KnowledgeTreePage };
