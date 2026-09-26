import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
	const [searchParameters] = useSearchParams();
	const { selectedEntry, tree } = useAppSelector((state) => state.knowledge);

	const [manualSelectedPageId, setManualSelectedPageId] = useState<
		number | undefined
	>();
	const [lastProjectId, setLastProjectId] = useState<null | string>(null);
	const [lastQueryNodeId, setLastQueryNodeId] = useState<null | string>(null);
	const [fetchedProjectId, setFetchedProjectId] = useState<null | string>(null);

	const queryNodeId = searchParameters.get("nodeId");
	const parsedNodeId = queryNodeId ? Number(queryNodeId) : undefined;
	const validTargetNodeId =
		parsedNodeId !== undefined && !Number.isNaN(parsedNodeId)
			? parsedNodeId
			: undefined;

	if (projectId !== lastProjectId) {
		setLastProjectId(projectId);
		setManualSelectedPageId(undefined);
		setFetchedProjectId(null);
	}

	if (queryNodeId !== lastQueryNodeId) {
		setLastQueryNodeId(queryNodeId);
		setManualSelectedPageId(undefined);
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

	const targetPage =
		isTreeReady && validTargetNodeId !== undefined
			? tree.find((item) => item.id === validTargetNodeId)
			: undefined;

	const activePageId =
		manualSelectedPageId ?? targetPage?.id ?? firstAvailablePage?.id;

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
			isTreeReady={isTreeReady}
			items={tree}
			onSelectPage={handleSelectPage}
			selectedPageId={activePageId}
		/>
	);
};

export { KnowledgeTreePage };
